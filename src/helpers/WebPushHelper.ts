import { ApiHelper, WebPushHelper as SharedWebPushHelper } from "@churchapps/apphelper";

// Configure once at module load so any caller of WebPushHelper.subscribe / .getRegistration
// uses the B1App PWA scope and appName.
SharedWebPushHelper.configure({ scope: "/mobile", appName: "B1AppPwa" });

const getServiceWorkerPath = () => process.env.NODE_ENV !== "production" ? "/dev-sw.js" : "/sw.js";
const isWebPushServerEnabled = () => process.env.NEXT_PUBLIC_ENABLE_WEBPUSH_SERVER === "true";

const urlBase64ToUint8Array = (base64: string) => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
};

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
  const config = await ApiHelper.get("/webpush/publicKey", "MessagingApi");
  const publicKey = config?.publicKey;
  if (!publicKey || !config?.enabled) return null;
  return publicKey as string;
};

const ensurePushSubscription = async (registration: ServiceWorkerRegistration): Promise<PushSubscription | null> => {
  if (typeof Notification === "undefined") return null;

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
    const registration = await ensureServiceWorkerReady();
    if (!registration) return null;

    try {
      const subscription = await ensurePushSubscription(registration);
      if (!subscription) return null;

      if (!isWebPushServerEnabled()) return subscription;

      await postSubscription(subscription);
      return subscription;
    } catch (error) {
      console.error("[webpush] subscribe failed:", error);
      throw error;
    }
  },
  refreshEnrollment: async () => {
    if (!isWebPushServerEnabled()) return;
    const subscription = await WebPushHelper.getExistingSubscription();
    if (!subscription) return;
    try {
      await postSubscription(subscription);
    } catch (error) {
      console.error("[webpush] refresh enrollment failed:", error);
      throw error;
    }
  },
  unsubscribe: async () => {
    const registration = await ensureServiceWorkerReady();
    const subscription = await registration?.pushManager.getSubscription();
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
