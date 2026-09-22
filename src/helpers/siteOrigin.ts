// Derived from env, never next/headers — reading headers would force every page dynamic.
const stage = () => process.env.NEXT_STAGE || process.env.NEXT_PUBLIC_STAGE || "";

export const localeOrigin = () => {
  if (typeof window !== "undefined") return window.location.origin;
  const vercel = process.env.VERCEL_URL?.replace(/^https?:\/\//, "");
  if (vercel) return "https://" + vercel;
  const s = stage();
  if (s === "prod") return "https://ironwood.b1.church";
  if (s === "staging") return "https://ironwood.staging.b1.church";
  return "http://127.0.0.1:" + (process.env.PORT || "3301");
};

export const publicOrigin = (sdSlug: string) => {
  const s = stage();
  if (s === "prod") return "https://" + sdSlug + ".b1.church";
  if (s === "staging") return "https://" + sdSlug + ".staging.b1.church";
  return "http://" + sdSlug + ".localtest.me:" + (process.env.PORT || "3301");
};
