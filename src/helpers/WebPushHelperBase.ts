import { ApiHelper, UserHelper } from "@churchapps/helpers";

// Relocated from apphelper 0.8.0; B1App wrapper adds PWA scope, enrollment tracking, diagnostics.

const OPT_OUT_KEY = "ca-webpush-opt-out";
const LAST_PROMPT_KEY = "ca-webpush-last-prompt";
const PROMPT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

let scope: string = "/";
let appName: string = "ChurchAppsPwa";

const urlBase64ToUint8Array = (base64: string): Uint8Array => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
};

const isSupported = (): boolean =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

/** Registers a Web Push subscription with MessagingApi; must re-subscribe on church change to avoid device-tenant mismatch. */
export const WebPushHelperBase = {
  configure(options: { scope?: string; appName?: string }) {
    if (options.scope) scope = options.scope;
    if (options.appName) appName = options.appName;
  },

  isSupported,

  isOptedOut(): boolean {
    try { return localStorage.getItem(OPT_OUT_KEY) === "1"; } catch { return false; }
  },

  setOptedOut(value: boolean) {
    try {
      if (value) localStorage.setItem(OPT_OUT_KEY, "1");
      else localStorage.removeItem(OPT_OUT_KEY);
    } catch { /* ignore */ }
  },

  canPromptNow(): boolean {
    if (!isSupported()) return false;
    if (Notification.permission !== "default") return false;
    if (WebPushHelperBase.isOptedOut()) return false;
    try {
      const last = Number(localStorage.getItem(LAST_PROMPT_KEY) || 0);
      if (last && Date.now() - last < PROMPT_COOLDOWN_MS) return false;
    } catch { /* ignore */ }
    return true;
  },

  markPrompted() {
    try { localStorage.setItem(LAST_PROMPT_KEY, String(Date.now())); } catch { /* ignore */ }
  },

  isStandalone(): boolean {
    if (typeof window === "undefined") return false;
    const mq = window.matchMedia?.("(display-mode: standalone)").matches;
    const iosStandalone = (window.navigator as any).standalone === true;
    return !!(mq || iosStandalone);
  },

  async getRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!isSupported()) return null;
    try { return (await navigator.serviceWorker.getRegistration(scope)) || null; } catch { return null; }
  },

  async getExistingSubscription(): Promise<PushSubscription | null> {
    const reg = await WebPushHelperBase.getRegistration();
    if (!reg) return null;
    try { return await reg.pushManager.getSubscription(); } catch { return null; }
  },

  /** Subscribe the active user; safe to call multiple times — server upserts by (churchId, fcmToken). */
  async subscribe(): Promise<PushSubscription | null> {
    if (!isSupported() || !UserHelper.user?.id) return null;
    const reg = await WebPushHelperBase.getRegistration();
    if (!reg) return null;

    const permission = await Notification.requestPermission();
    WebPushHelperBase.markPrompted();
    if (permission !== "granted") return null;

    const config = await ApiHelper.get("/webpush/publicKey", "MessagingApi");
    const publicKey: string | undefined = config?.publicKey;
    if (!publicKey || !config?.enabled) return null;

    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      await WebPushHelperBase.postSubscription(existing);
      WebPushHelperBase.setOptedOut(false);
      return existing;
    }

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource
    });
    await WebPushHelperBase.postSubscription(subscription);
    WebPushHelperBase.setOptedOut(false);
    return subscription;
  },

  /** Re-enroll existing subscription (no permission prompt); updates device to new church after switch. */
  async refreshEnrollment(): Promise<void> {
    if (!isSupported() || !UserHelper.user?.id) return;
    const sub = await WebPushHelperBase.getExistingSubscription();
    if (!sub) return;
    await WebPushHelperBase.postSubscription(sub);
  },

  async unsubscribe(): Promise<void> {
    WebPushHelperBase.setOptedOut(true);
    const sub = await WebPushHelperBase.getExistingSubscription();
    if (!sub) return;
    const endpoint = sub.endpoint;
    try { await sub.unsubscribe(); } catch { /* ignore */ }
    try { await ApiHelper.post("/webpush/unsubscribe", { endpoint }, "MessagingApi"); } catch { /* ignore */ }
  },

  async postSubscription(sub: PushSubscription) {
    const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;
    const body = {
      subscription: {
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth }
      },
      appName,
      deviceInfo: typeof navigator !== "undefined" ? navigator.userAgent : undefined
    };
    try { await ApiHelper.post("/webpush/subscribe", body, "MessagingApi"); } catch { /* ignore */ }
  }
};
