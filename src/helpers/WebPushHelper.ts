import { ApiHelper, UserHelper, WebPushHelper as SharedWebPushHelper } from "@churchapps/apphelper";

// Configure once at module load so any caller of WebPushHelper.subscribe / .getRegistration
// uses the B1App PWA scope and appName.
SharedWebPushHelper.configure({ scope: "/mobile", appName: "B1AppPwa" });

const getServiceWorkerPath = () => process.env.NODE_ENV !== "production" ? "/dev-sw.js" : "/sw.js";
const isWebPushServerEnabled = () => process.env.NEXT_PUBLIC_ENABLE_WEBPUSH_SERVER !== "false";
const WEB_PUSH_SW_VERSION = "2026-05-22-webpush-frontend-1";
const SERVER_ENROLLMENT_KEY = "b1-webpush-server-enrollment";
const SW_DIAGNOSTICS_KEY = "b1-webpush-sw-diagnostics";
const MAX_SW_DIAGNOSTICS = 50;

interface WindowWithWebPushDebug extends Window {
  __diag?: {
    webpush?: () => Promise<WebPushDebugSnapshot>;
    webpushResubscribe?: () => Promise<PushSubscription | null>;
  };
  __b1WebPushDiagnosticsBound?: boolean;
}

export type WebPushPermissionState = "unsupported" | "default" | "denied" | "granted";

export interface WebPushDiagnostics {
  permission: WebPushPermissionState;
  isStandalone: boolean;
  canPromptNow: boolean;
  serverRegistrationEnabled: boolean;
  publicKeyConfigured: boolean;
  hasServiceWorkerRegistration: boolean;
  hasSubscription: boolean;
  hasConfirmedServerEnrollment: boolean;
  statusReason: string | null;
}

export interface ServiceWorkerDiagnosticEntry {
  time: string;
  source: "client" | "service-worker";
  level: "info" | "warn" | "error";
  event: string;
  details?: Record<string, unknown>;
}

export interface WebPushDebugSnapshot {
  diagnostics: WebPushDiagnostics;
  permission: NotificationPermission | "unsupported";
  publicKey: string | null;
  publicKeyFingerprint: string | null;
  registration: {
    scope: string | null;
    activeScriptURL: string | null;
    waitingScriptURL: string | null;
    installingScriptURL: string | null;
    activeState: string | null;
  };
  worker: {
    version: string | null;
    controlled: boolean;
    lastDiagnostics: ServiceWorkerDiagnosticEntry[];
  };
  subscription: {
    endpoint: string | null;
    endpointHost: string | null;
    json: PushSubscriptionJSON | null;
  };
  enrollment: StoredServerEnrollment | null;
}

const log = (message: string, details?: unknown) => {
  if (details === undefined) console.info(`[webpush] ${message}`);
  else console.info(`[webpush] ${message}`, details);
};

interface StoredServerEnrollment {
  endpoint: string;
  userId: string;
  churchId: string;
  publicKeyFingerprint?: string;
  serviceWorkerVersion?: string;
  serviceWorkerScriptUrl?: string;
}

interface PublicKeyConfig {
  publicKey: string;
  fingerprint: string;
}

let cachedPublicKeyConfig: PublicKeyConfig | null = null;
let cachedPublicKeyLoadedAt = 0;

const urlBase64ToUint8Array = (base64: string) => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
};

const fingerprint = (value: string) => {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) hash = ((hash << 5) + hash) ^ value.charCodeAt(i);
  return (hash >>> 0).toString(16).padStart(8, "0");
};

const summarizeEndpointHost = (endpoint?: string | null) => {
  if (!endpoint) return null;
  try {
    return new URL(endpoint).host;
  } catch {
    return null;
  }
};

const readServiceWorkerDiagnostics = (): ServiceWorkerDiagnosticEntry[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SW_DIAGNOSTICS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as ServiceWorkerDiagnosticEntry[] : [];
  } catch {
    return [];
  }
};

const writeServiceWorkerDiagnostic = (entry: ServiceWorkerDiagnosticEntry) => {
  if (typeof window === "undefined") return;
  const next = [...readServiceWorkerDiagnostics(), entry].slice(-MAX_SW_DIAGNOSTICS);
  try {
    localStorage.setItem(SW_DIAGNOSTICS_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage issues; diagnostics are best-effort.
  }
};

const bindDiagnosticsBridge = () => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const debugWindow = window as WindowWithWebPushDebug;
  if (debugWindow.__b1WebPushDiagnosticsBound) return;
  debugWindow.__b1WebPushDiagnosticsBound = true;

  navigator.serviceWorker.addEventListener("message", (event: MessageEvent) => {
    const data = event.data as { type?: string; entry?: ServiceWorkerDiagnosticEntry } | undefined;
    if (data?.type !== "B1_WEBPUSH_DIAGNOSTIC" || !data.entry) return;
    writeServiceWorkerDiagnostic(data.entry);
  });

  debugWindow.__diag = debugWindow.__diag || {};
  debugWindow.__diag.webpush = async () => WebPushHelper.getDebugSnapshot();
  debugWindow.__diag.webpushResubscribe = async () => WebPushHelper.forceResubscribe("manual-debug");
};

const pingActiveWorker = async (): Promise<{ version: string | null; scope: string | null }> => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return { version: null, scope: null };
  }

  const readyRegistration = await navigator.serviceWorker.ready.catch((): ServiceWorkerRegistration | null => null);
  const target = navigator.serviceWorker.controller || readyRegistration?.active;
  if (!target) return { version: null, scope: null };

  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timeout = window.setTimeout(() => resolve({ version: null, scope: null }), 1500);
    channel.port1.onmessage = (event) => {
      window.clearTimeout(timeout);
      resolve({
        version: event.data?.version || null,
        scope: event.data?.scope || null
      });
    };
    try {
      target.postMessage({ type: "B1_WEBPUSH_DIAGNOSTICS_PING" }, [channel.port2]);
    } catch {
      window.clearTimeout(timeout);
      resolve({ version: null, scope: null });
    }
  });
};

const getCurrentEnrollmentContext = () => ({
  userId: UserHelper.user?.id || "",
  churchId: UserHelper.currentUserChurch?.church?.id || ""
});

const getStoredServerEnrollment = (): StoredServerEnrollment | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SERVER_ENROLLMENT_KEY) || "";
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredServerEnrollment>;
    if (!parsed.endpoint || !parsed.userId || !parsed.churchId) return null;
    return {
      endpoint: parsed.endpoint,
      userId: parsed.userId,
      churchId: parsed.churchId
    };
  } catch {
    return null;
  }
};

const storeServerEnrollmentEndpoint = (endpoint?: string | null) => {
  storeServerEnrollmentMetadata(endpoint);
};

const storeServerEnrollmentMetadata = (
  endpoint?: string | null,
  metadata?: { publicKeyFingerprint?: string | null; serviceWorkerScriptUrl?: string | null; serviceWorkerVersion?: string | null }
) => {
  if (typeof window === "undefined") return;
  try {
    if (endpoint) {
      const context = getCurrentEnrollmentContext();
      if (!context.userId || !context.churchId) return;
      localStorage.setItem(SERVER_ENROLLMENT_KEY, JSON.stringify({
        endpoint,
        userId: context.userId,
        churchId: context.churchId,
        publicKeyFingerprint: metadata?.publicKeyFingerprint || undefined,
        serviceWorkerScriptUrl: metadata?.serviceWorkerScriptUrl || undefined,
        serviceWorkerVersion: metadata?.serviceWorkerVersion || WEB_PUSH_SW_VERSION
      } satisfies StoredServerEnrollment));
    } else localStorage.removeItem(SERVER_ENROLLMENT_KEY);
  } catch {
    // Ignore storage failures; they should not block notification setup.
  }
};

const getPermissionState = (): WebPushPermissionState => {
  if (!SharedWebPushHelper.isSupported()) return "unsupported";
  if (typeof Notification === "undefined") return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return "default";
};

const isIos = () => {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent || "");
};

const requiresInstallForPush = () => SharedWebPushHelper.isSupported() && isIos() && !SharedWebPushHelper.isStandalone();

const ensureServiceWorkerReady = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  bindDiagnosticsBridge();

  let registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    try {
      log("no service worker registration found; registering", { scope: "/", script: getServiceWorkerPath() });
      registration = await navigator.serviceWorker.register(getServiceWorkerPath(), {
        scope: "/",
        updateViaCache: "none"
      });
    } catch (error) {
      console.error("[webpush] service worker registration failed:", error);
      registration = null;
    }
  }

  if (!registration) return null;

  if (registration.waiting) {
    try {
      registration.waiting.postMessage({ type: "B1_SKIP_WAITING" });
    } catch {
      // Ignore; the waiting worker will activate on the next navigation if messaging fails.
    }
  }

  await registration.update().catch((): void => {});

  if (registration.active) return registration;

  try {
    const ready = await navigator.serviceWorker.ready;
    return ready || registration;
  } catch (error) {
    console.error("[webpush] waiting for service worker readiness failed:", error);
    return registration;
  }
};

const getPublicKeyConfig = async (): Promise<PublicKeyConfig | null> => {
  if (cachedPublicKeyConfig && Date.now() - cachedPublicKeyLoadedAt < 60 * 1000) return cachedPublicKeyConfig;
  try {
    const config = await ApiHelper.get("/webpush/publicKey", "MessagingApi");
    const publicKey = config?.publicKey;
    if (!publicKey || !config?.enabled) return null;
    cachedPublicKeyConfig = {
      publicKey: publicKey as string,
      fingerprint: fingerprint(publicKey as string)
    };
    cachedPublicKeyLoadedAt = Date.now();
    log("loaded public VAPID key from backend", {
      enabled: !!config?.enabled,
      publicKey: cachedPublicKeyConfig.publicKey,
      publicKeyFingerprint: cachedPublicKeyConfig.fingerprint
    });
    return cachedPublicKeyConfig;
  } catch (error) {
    console.error("[webpush] failed to load public key config:", error);
    return null;
  }
};

const notifyServerOfUnsubscribe = async (endpoint?: string | null) => {
  if (!endpoint || !isWebPushServerEnabled()) return;
  try {
    await ApiHelper.post("/webpush/unsubscribe", { endpoint }, "MessagingApi");
  } catch (error) {
    console.error("[webpush] server unsubscribe failed:", error);
  }
};

const shouldRefreshSubscription = (registration: ServiceWorkerRegistration, publicKeyFingerprint: string, subscription: PushSubscription) => {
  const stored = getStoredServerEnrollment();
  const activeScriptUrl = registration.active?.scriptURL || registration.waiting?.scriptURL || registration.installing?.scriptURL || "";
  if (!stored) return null;
  if (stored.endpoint && stored.endpoint !== subscription.endpoint) return "endpoint-changed";
  if (stored.publicKeyFingerprint && stored.publicKeyFingerprint !== publicKeyFingerprint) return "public-key-changed";
  if (stored.serviceWorkerVersion && stored.serviceWorkerVersion !== WEB_PUSH_SW_VERSION) return "service-worker-version-changed";
  if (stored.serviceWorkerScriptUrl && activeScriptUrl && stored.serviceWorkerScriptUrl !== activeScriptUrl) return "service-worker-script-changed";
  return null;
};

const refreshSubscriptionIfNeeded = async (
  registration: ServiceWorkerRegistration,
  publicKeyConfig: PublicKeyConfig,
  existing: PushSubscription | null
) => {
  if (!existing) return null;
  const reason = shouldRefreshSubscription(registration, publicKeyConfig.fingerprint, existing);
  if (!reason) return existing;

  log("refreshing stale browser subscription", {
    reason,
    endpointHost: summarizeEndpointHost(existing.endpoint),
    serviceWorkerVersion: WEB_PUSH_SW_VERSION
  });

  try {
    await existing.unsubscribe();
  } catch (error) {
    console.error("[webpush] stale subscription unsubscribe failed:", error);
  }
  await notifyServerOfUnsubscribe(existing.endpoint);
  storeServerEnrollmentMetadata(null);
  return null;
};

const ensurePushSubscription = async (registration: ServiceWorkerRegistration): Promise<PushSubscription | null> => {
  if (typeof Notification === "undefined") return null;
  if (requiresInstallForPush()) return null;

  const permission = Notification.permission === "granted"
    ? "granted"
    : await Notification.requestPermission();

  if (permission !== "granted") return null;

  const publicKeyConfig = await getPublicKeyConfig();
  if (!publicKeyConfig) return null;

  const existing = await refreshSubscriptionIfNeeded(
    registration,
    publicKeyConfig,
    await registration.pushManager.getSubscription()
  );
  if (existing) return existing;

  log("subscribing with public VAPID key", {
    publicKey: publicKeyConfig.publicKey,
    publicKeyFingerprint: publicKeyConfig.fingerprint
  });

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKeyConfig.publicKey)
  });
};

const postSubscription = async (subscription: PushSubscription) => {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error("Push subscription is missing endpoint or encryption keys.");
  }

  await ApiHelper.post("/webpush/subscribe", {
    subscription: {
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth }
    },
    appName: "B1AppPwa",
    deviceInfo: typeof navigator !== "undefined" ? navigator.userAgent : undefined
  }, "MessagingApi");
};

export const WebPushHelper = {
  ...SharedWebPushHelper,
  getPermissionState,
  isServerRegistrationEnabled: () => isWebPushServerEnabled(),
  getRegistration: async () => ensureServiceWorkerReady(),
  getExistingSubscription: async () => {
    const registration = await ensureServiceWorkerReady();
    if (!registration) return null;
    try {
      return await registration.pushManager.getSubscription();
    } catch {
      return null;
    }
  },
  subscribe: async () => {
    const { userId, churchId } = getCurrentEnrollmentContext();
    if (!userId || !churchId) return null;

    const registration = await ensureServiceWorkerReady();
    if (!registration) return null;

    try {
      log("starting subscribe flow", {
        permission: getPermissionState(),
        serverRegistrationEnabled: isWebPushServerEnabled()
      });
      const subscription = await ensurePushSubscription(registration);
      if (!subscription) {
        if (getPermissionState() === "granted") {
          throw new Error("Notification permission is granted, but this device did not create a push subscription.");
        }
        return null;
      }

      if (!isWebPushServerEnabled()) return subscription;

      const publicKeyConfig = await getPublicKeyConfig();
      await postSubscription(subscription);
      storeServerEnrollmentMetadata(subscription.endpoint, {
        publicKeyFingerprint: publicKeyConfig?.fingerprint || null,
        serviceWorkerScriptUrl: registration.active?.scriptURL || registration.waiting?.scriptURL || registration.installing?.scriptURL || null,
        serviceWorkerVersion: WEB_PUSH_SW_VERSION
      });
      log("server registration completed", {
        endpoint: subscription.endpoint,
        endpointHost: summarizeEndpointHost(subscription.endpoint),
        publicKeyFingerprint: publicKeyConfig?.fingerprint || null,
        serviceWorkerVersion: WEB_PUSH_SW_VERSION
      });
      return subscription;
    } catch (error) {
      console.error("[webpush] subscribe failed:", error);
      throw error;
    }
  },
  hasConfirmedServerEnrollment: async () => {
    if (!isWebPushServerEnabled()) return false;
    const subscription = await WebPushHelper.getExistingSubscription();
    if (!subscription?.endpoint) {
      storeServerEnrollmentEndpoint(null);
      return false;
    }
    const stored = getStoredServerEnrollment();
    const { userId, churchId } = getCurrentEnrollmentContext();
    if (!stored || !userId || !churchId) return false;
    return stored.endpoint === subscription.endpoint && stored.userId === userId && stored.churchId === churchId;
  },
  refreshEnrollment: async () => {
    if (!isWebPushServerEnabled()) return;
    const { userId, churchId } = getCurrentEnrollmentContext();
    if (!userId || !churchId) return;
    const registration = await ensureServiceWorkerReady();
    if (!registration) return;
    const subscription = await ensurePushSubscription(registration);
    if (!subscription) return;
    try {
      const publicKeyConfig = await getPublicKeyConfig();
      log("refreshing server enrollment", { endpoint: subscription.endpoint });
      await postSubscription(subscription);
      storeServerEnrollmentMetadata(subscription.endpoint, {
        publicKeyFingerprint: publicKeyConfig?.fingerprint || null,
        serviceWorkerScriptUrl: registration.active?.scriptURL || registration.waiting?.scriptURL || registration.installing?.scriptURL || null,
        serviceWorkerVersion: WEB_PUSH_SW_VERSION
      });
    } catch (error) {
      console.error("[webpush] refresh enrollment failed:", error);
      throw error;
    }
  },
  getDiagnostics: async (): Promise<WebPushDiagnostics> => {
    const permission = getPermissionState();
    const isStandalone = SharedWebPushHelper.isStandalone();
    const publicKeyConfig = permission === "granted" || permission === "default"
      ? await getPublicKeyConfig()
      : null;
    const registration = await WebPushHelper.getRegistration();
    const subscription = await WebPushHelper.getExistingSubscription();
    const hasConfirmedEnrollment = permission === "granted"
      ? await WebPushHelper.hasConfirmedServerEnrollment()
      : false;
    let statusReason: string | null = null;

    if (permission === "denied") {
      statusReason = "Notifications are blocked in browser settings.";
    } else if (permission === "default") {
      statusReason = "Notification permission has not been granted yet.";
    } else if (requiresInstallForPush()) {
      statusReason = "Install this app to the home screen before Safari can complete push registration.";
    } else if (!registration) {
      statusReason = "Service worker registration is missing on this device.";
    } else if (!publicKeyConfig) {
      statusReason = "The push public key is unavailable, so this device cannot register yet.";
    } else if (!subscription) {
      statusReason = "Notification permission is granted, but the browser did not create a device subscription.";
    } else if (isWebPushServerEnabled() && !hasConfirmedEnrollment) {
      statusReason = "The device subscription exists, but backend registration did not complete.";
    }

    return {
      permission,
      isStandalone,
      canPromptNow: SharedWebPushHelper.canPromptNow(),
      serverRegistrationEnabled: isWebPushServerEnabled(),
      publicKeyConfigured: !!publicKeyConfig,
      hasServiceWorkerRegistration: !!registration,
      hasSubscription: !!subscription,
      hasConfirmedServerEnrollment: hasConfirmedEnrollment,
      statusReason
    };
  },
  forceResubscribe: async (reason = "manual") => {
    const registration = await ensureServiceWorkerReady();
    if (!registration) return null;
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      log("forcing browser resubscribe", { reason, endpointHost: summarizeEndpointHost(existing.endpoint) });
      try {
        await existing.unsubscribe();
      } catch (error) {
        console.error("[webpush] force unsubscribe failed:", error);
      }
      await notifyServerOfUnsubscribe(existing.endpoint);
      storeServerEnrollmentMetadata(null);
    }
    return WebPushHelper.subscribe();
  },
  getDebugSnapshot: async (): Promise<WebPushDebugSnapshot> => {
    const diagnostics = await WebPushHelper.getDiagnostics();
    const registration = await ensureServiceWorkerReady();
    const subscription = await WebPushHelper.getExistingSubscription();
    const publicKeyConfig = await getPublicKeyConfig();
    const workerInfo = await pingActiveWorker();
    return {
      diagnostics,
      permission: typeof Notification === "undefined" ? "unsupported" : Notification.permission,
      publicKey: publicKeyConfig?.publicKey || null,
      publicKeyFingerprint: publicKeyConfig?.fingerprint || null,
      registration: {
        scope: registration?.scope || null,
        activeScriptURL: registration?.active?.scriptURL || null,
        waitingScriptURL: registration?.waiting?.scriptURL || null,
        installingScriptURL: registration?.installing?.scriptURL || null,
        activeState: registration?.active?.state || null
      },
      worker: {
        version: workerInfo.version || WEB_PUSH_SW_VERSION,
        controlled: !!navigator.serviceWorker.controller,
        lastDiagnostics: readServiceWorkerDiagnostics()
      },
      subscription: {
        endpoint: subscription?.endpoint || null,
        endpointHost: summarizeEndpointHost(subscription?.endpoint),
        json: subscription?.toJSON() || null
      },
      enrollment: getStoredServerEnrollment()
    };
  },
  requiresInstallForPush,
  logDiagnostics: async (context: string) => {
    try {
      const diagnostics = await WebPushHelper.getDiagnostics();
      log(`diagnostics (${context})`, diagnostics);
      return diagnostics;
    } catch (error) {
      console.error(`[webpush] diagnostics failed (${context}):`, error);
      throw error;
    }
  },
  unsubscribe: async () => {
    const registration = await ensureServiceWorkerReady();
    const subscription = await registration?.pushManager.getSubscription();
    storeServerEnrollmentMetadata(null);
    if (!subscription) return;
    const endpoint = subscription.endpoint;
    try {
      await subscription.unsubscribe();
    } catch (error) {
      console.error("[webpush] unsubscribe failed:", error);
    }
    await notifyServerOfUnsubscribe(endpoint);
  }
};

bindDiagnosticsBridge();
