"use client";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface InstallPromptState {
  deferred: BeforeInstallPromptEvent | null;
  installed: boolean;
}

type Listener = (state: InstallPromptState) => void;

const listeners = new Set<Listener>();

let started = false;
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;

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
  installed = detectStandalone();
  if (!installed) return;
  deferredPrompt = null;
};

const handleBeforeInstallPrompt = (event: Event) => {
  event.preventDefault();
  deferredPrompt = event as BeforeInstallPromptEvent;
  refreshInstalledState();
  emit();
};

const handleAppInstalled = () => {
  installed = true;
  deferredPrompt = null;
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
