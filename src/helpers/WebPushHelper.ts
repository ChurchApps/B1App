import { ApiHelper, UserHelper } from "@churchapps/apphelper";
import { WebPushHelperBase as SharedWebPushHelper } from "./WebPushHelperBase";

// Configure once at module load so any caller of WebPushHelper.subscribe / .getRegistration
// uses the B1App PWA scope and appName.
SharedWebPushHelper.configure({ scope: "/mobile", appName: "B1AppPwa" });

const getServiceWorkerPath = () => "/sw.js";
const isWebPushServerEnabled = () => process.env.NEXT_PUBLIC_ENABLE_WEBPUSH_SERVER !== "false";
const WEB_PUSH_SW_VERSION = "2026-05-29-webpush-appbadge-1";
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

  let registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    try {
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
    if (!registration?.active) return null;

    try {
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
  requiresInstallForPush,
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
