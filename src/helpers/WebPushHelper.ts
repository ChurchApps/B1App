import { ApiHelper, UserHelper, WebPushHelper as SharedWebPushHelper } from "@churchapps/apphelper";

// Configure once at module load so any caller of WebPushHelper.subscribe / .getRegistration
// uses the B1App PWA scope and appName.
SharedWebPushHelper.configure({ scope: "/mobile", appName: "B1AppPwa" });

const getServiceWorkerPath = () => process.env.NODE_ENV !== "production" ? "/dev-sw.js" : "/sw.js";
const isWebPushServerEnabled = () => process.env.NEXT_PUBLIC_ENABLE_WEBPUSH_SERVER === "true";
const SERVER_ENROLLMENT_KEY = "b1-webpush-server-enrollment";

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

const log = (message: string, details?: unknown) => {
  if (details === undefined) console.info(`[webpush] ${message}`);
  else console.info(`[webpush] ${message}`, details);
};

interface StoredServerEnrollment {
  endpoint: string;
  userId: string;
  churchId: string;
}

const urlBase64ToUint8Array = (base64: string) => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
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
  if (typeof window === "undefined") return;
  try {
    if (endpoint) {
      const context = getCurrentEnrollmentContext();
      if (!context.userId || !context.churchId) return;
      localStorage.setItem(SERVER_ENROLLMENT_KEY, JSON.stringify({
        endpoint,
        userId: context.userId,
        churchId: context.churchId
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

  if (registration.active) return registration;

  try {
    const ready = await navigator.serviceWorker.ready;
    return ready || registration;
  } catch (error) {
    console.error("[webpush] waiting for service worker readiness failed:", error);
    return registration;
  }
};

const getPublicKeyConfig = async () => {
  try {
    const config = await ApiHelper.get("/webpush/publicKey", "MessagingApi");
    const publicKey = config?.publicKey;
    if (!publicKey || !config?.enabled) return null;
    return publicKey as string;
  } catch (error) {
    console.error("[webpush] failed to load public key config:", error);
    return null;
  }
};

const ensurePushSubscription = async (registration: ServiceWorkerRegistration): Promise<PushSubscription | null> => {
  if (typeof Notification === "undefined") return null;
  if (requiresInstallForPush()) return null;

  const permission = Notification.permission === "granted"
    ? "granted"
    : await Notification.requestPermission();

  if (permission !== "granted") return null;

  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  const publicKey = await getPublicKeyConfig();
  if (!publicKey) return null;

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey)
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

      await postSubscription(subscription);
      storeServerEnrollmentEndpoint(subscription.endpoint);
      log("server registration completed", { endpoint: subscription.endpoint });
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
    const subscription = await WebPushHelper.getExistingSubscription();
    if (!subscription) return;
    try {
      log("refreshing server enrollment", { endpoint: subscription.endpoint });
      await postSubscription(subscription);
      storeServerEnrollmentEndpoint(subscription.endpoint);
    } catch (error) {
      console.error("[webpush] refresh enrollment failed:", error);
      throw error;
    }
  },
  getDiagnostics: async (): Promise<WebPushDiagnostics> => {
    const permission = getPermissionState();
    const isStandalone = SharedWebPushHelper.isStandalone();
    const publicKey = permission === "granted" || permission === "default"
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
    } else if (!publicKey) {
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
      publicKeyConfigured: !!publicKey,
      hasServiceWorkerRegistration: !!registration,
      hasSubscription: !!subscription,
      hasConfirmedServerEnrollment: hasConfirmedEnrollment,
      statusReason
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
    storeServerEnrollmentEndpoint(null);
    if (!subscription) return;
    const endpoint = subscription.endpoint;
    try {
      await subscription.unsubscribe();
    } catch (error) {
      console.error("[webpush] unsubscribe failed:", error);
    }
    if (!isWebPushServerEnabled()) return;
    try {
      await ApiHelper.post("/webpush/unsubscribe", { endpoint }, "MessagingApi");
    } catch (error) {
      console.error("[webpush] server unsubscribe failed:", error);
    }
  }
};
