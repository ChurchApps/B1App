import { CommonEnvironmentHelper } from "@churchapps/helpers";

export interface NotificationErrorDetails {
  name: string;
  message: string;
  summary: string;
  rawType: string;
  details?: Record<string, unknown>;
}

export interface SocketDiagnostics {
  configuredUrl: string;
  normalizedUrl: string;
  valid: boolean;
  compatible: boolean;
  securePage: boolean;
  reason: string | null;
}

export const formatNotificationError = (error: unknown): NotificationErrorDetails => {
  if (error instanceof Error) {
    return {
      name: error.name || "Error",
      message: error.message || "Unknown error",
      summary: `${error.name || "Error"}: ${error.message || "Unknown error"}`,
      rawType: error.constructor?.name || "Error"
    };
  }

  if (typeof Event !== "undefined" && error instanceof Event) {
    const eventTarget = error.target as WebSocket | null;
    const readyState = typeof eventTarget?.readyState === "number" ? eventTarget.readyState : undefined;
    const currentUrl = typeof eventTarget?.url === "string" ? eventTarget.url : undefined;
    const details = {
      type: error.type,
      targetType: eventTarget?.constructor?.name || typeof error.target,
      readyState,
      url: currentUrl
    };

    return {
      name: "BrowserEvent",
      message: `Browser emitted a "${error.type}" event during notification initialization.`,
      summary: `BrowserEvent: ${error.type}${currentUrl ? ` (${currentUrl})` : ""}`,
      rawType: "Event",
      details
    };
  }

  if (typeof error === "string") {
    return {
      name: "StringError",
      message: error,
      summary: error,
      rawType: "string"
    };
  }

  return {
    name: "UnknownError",
    message: "An unknown notification initialization error occurred.",
    summary: "UnknownError",
    rawType: Object.prototype.toString.call(error),
    details: typeof error === "object" && error ? { ...error as Record<string, unknown> } : undefined
  };
};

export const getSocketDiagnostics = (inputUrl?: string): SocketDiagnostics => {
  const configuredUrl = (inputUrl || CommonEnvironmentHelper.MessagingApiSocket || "").trim();
  const securePage = typeof window !== "undefined" && window.location.protocol === "https:";

  if (!configuredUrl) {
    return {
      configuredUrl,
      normalizedUrl: "",
      valid: false,
      compatible: false,
      securePage,
      reason: "Messaging socket URL is not configured."
    };
  }

  try {
    const url = new URL(configuredUrl);
    const isWs = url.protocol === "ws:" || url.protocol === "wss:";
    if (!isWs) {
      return {
        configuredUrl,
        normalizedUrl: url.toString(),
        valid: false,
        compatible: false,
        securePage,
        reason: `Messaging socket must use ws:// or wss://. Received ${url.protocol}`
      };
    }

    if (securePage && url.protocol === "ws:") {
      return {
        configuredUrl,
        normalizedUrl: url.toString(),
        valid: true,
        compatible: false,
        securePage,
        reason: "This page is running over HTTPS but the messaging socket is configured as ws://. Browsers block insecure WebSockets on secure pages."
      };
    }

    return {
      configuredUrl,
      normalizedUrl: url.toString(),
      valid: true,
      compatible: true,
      securePage,
      reason: null
    };
  } catch {
    return {
      configuredUrl,
      normalizedUrl: configuredUrl,
      valid: false,
      compatible: false,
      securePage,
      reason: "Messaging socket URL is not a valid URL."
    };
  }
};
