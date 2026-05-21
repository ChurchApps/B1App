import { loadChurchAppearance } from "./[sdSlug]/mobile/loadChurchAppearance";

const normalizeBasePath = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
};

const withBasePath = (basePath: string, path: string) => {
  const normalizedBasePath = normalizeBasePath(basePath);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBasePath}${normalizedPath}`;
};

export async function buildManifest(sdSlug: string, basePath = `/${sdSlug}`) {
  const { churchName, primaryColor } = await loadChurchAppearance(sdSlug);
  const themeColor = primaryColor || "#0D47A1";
  const safeName = (churchName && churchName.trim()) || sdSlug || "Church";
  const shortName = safeName.length > 12 ? safeName.substring(0, 12) : safeName;

  return {
    id: withBasePath(basePath, "/mobile/dashboard"),
    name: safeName,
    short_name: shortName,
    description: `${safeName} mobile app`,
    start_url: withBasePath(basePath, "/mobile/dashboard?source=pwa"),
    scope: withBasePath(basePath, "/mobile/"),
    display: "standalone",
    orientation: "portrait",
    background_color: "#F6F6F8",
    theme_color: themeColor,
    categories: ["lifestyle", "social"],
    icons: [
      { src: withBasePath(basePath, "/mobile/icon/192"), sizes: "192x192", type: "image/png", purpose: "any" },
      { src: withBasePath(basePath, "/mobile/icon/512"), sizes: "512x512", type: "image/png", purpose: "any" },
      { src: withBasePath(basePath, "/mobile/icon/192"), sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: withBasePath(basePath, "/mobile/icon/512"), sizes: "512x512", type: "image/png", purpose: "maskable" }
    ],
    screenshots: [
      {
        src: withBasePath(basePath, "/mobile/screenshot/wide"),
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: `${safeName} dashboard`
      },
      {
        src: withBasePath(basePath, "/mobile/screenshot/narrow"),
        sizes: "720x1280",
        type: "image/png",
        form_factor: "narrow",
        label: `${safeName} dashboard`
      }
    ]
  };
}
