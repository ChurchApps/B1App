interface NamedLike {
  name?: {
    first?: string;
    last?: string;
    display?: string;
  };
}

export const getInitials = (src: NamedLike | string | null | undefined, fallback = "?"): string => {
  if (!src) return fallback;
  let first = "";
  let last = "";
  let display = "";
  if (typeof src === "string") {
    display = src.trim();
  } else {
    first = (src.name?.first || "").trim();
    last = (src.name?.last || "").trim();
    display = (src.name?.display || "").trim();
  }
  if (!first && !last && display) {
    const parts = display.split(/\s+/);
    first = parts[0] || "";
    last = parts.length > 1 ? parts[parts.length - 1] : "";
  }
  const f = first.charAt(0).toUpperCase();
  const l = last.charAt(0).toUpperCase();
  const combined = `${f}${l}`;
  if (combined) return combined;
  const single = (display || "").charAt(0).toUpperCase();
  return single || fallback;
};

export const formatDuration = (seconds?: number | null): string => {
  if (!seconds || seconds <= 0) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const toDate = (value?: Date | string | number | null): Date | null => {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

export const formatDate = (
  value?: Date | string | number | null,
  style: "long" | "short" = "long"
): string => {
  const d = toDate(value);
  if (!d) return "";
  return d.toLocaleDateString(undefined, {
    month: style === "short" ? "short" : "long",
    day: "numeric",
    year: "numeric"
  });
};

export const formatRelative = (value?: Date | string | number | null): string => {
  const d = toDate(value);
  if (!d) return "";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) {
    if (diffHours <= 0) return "now";
    return `${diffHours}h`;
  }
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export const navigateBack = (
  router: { back: () => void; push: (path: string) => void },
  fallback: string
): void => {
  if (typeof window !== "undefined" && window.history.length > 1) router.back();
  else router.push(fallback);
};

export const shadePrimary = (cssColor: string, percent: number): string => {
  const mixer = percent < 0 ? "black" : "white";
  return `color-mix(in srgb, ${cssColor} ${100 - Math.abs(percent)}%, ${mixer})`;
};
