"use client";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface InstallPromptState {
  deferred: BeforeInstallPromptEvent | null;
  installed: boolean;
}

interface EarlyInstallPromptState {
  deferredPrompt?: BeforeInstallPromptEvent | null;
  installed?: boolean;
}

type Listener = (state: InstallPromptState) => void;

const listeners = new Set<Listener>();

let started = false;
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;

const getEarlyState = (): EarlyInstallPromptState | null => {
  if (typeof window === "undefined") return null;
  return ((window as Window & { __b1InstallPromptState?: EarlyInstallPromptState }).__b1InstallPromptState) || null;
};

const emit = () => {
  const state = InstallPromptHelper.getState();
  listeners.forEach((listener) => listener(state));
};

const detectStandalone = (): boolean => {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  if ((window.navigator as Navigator & { standalone?: boolean }).standalone === true) return true;
  return false;
};

const refreshInstalledState = () => {
  const earlyState = getEarlyState();
  installed = detectStandalone();
  if (earlyState?.deferredPrompt && !installed) deferredPrompt = earlyState.deferredPrompt;
  if (typeof earlyState?.installed === "boolean") installed = installed || earlyState.installed;
  if (!installed) return;
  deferredPrompt = null;
  if (earlyState) earlyState.deferredPrompt = null;
};

const handleBeforeInstallPrompt = (event: Event) => {
  event.preventDefault();
  deferredPrompt = event as BeforeInstallPromptEvent;
  const earlyState = getEarlyState();
  if (earlyState) {
    earlyState.deferredPrompt = deferredPrompt;
    earlyState.installed = false;
  }
  refreshInstalledState();
  emit();
};

const handleAppInstalled = () => {
  installed = true;
  deferredPrompt = null;
  const earlyState = getEarlyState();
  if (earlyState) {
    earlyState.installed = true;
    earlyState.deferredPrompt = null;
  }
  emit();
};

const handleVisibilityChange = () => {
  refreshInstalledState();
  emit();
};

export const InstallPromptHelper = {
  start() {
    if (typeof window === "undefined" || started) return;
    started = true;
    refreshInstalledState();
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("focus", handleVisibilityChange);
    window.addEventListener("pageshow", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
  },
  getState(): InstallPromptState {
    return { deferred: deferredPrompt, installed };
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    listener(InstallPromptHelper.getState());
    return () => {
      listeners.delete(listener);
    };
  },
  clearDeferredPrompt() {
    deferredPrompt = null;
    emit();
  }
};
