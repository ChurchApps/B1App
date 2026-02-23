"use client";
import { useState, useEffect, useMemo } from "react";
import { getProvider, navigateToPath, type Instructions } from "@churchapps/content-providers";
import { ApiHelper } from "@churchapps/apphelper";

export interface ProviderContentChild {
  id?: string;
  label?: string;
  description?: string;
  seconds?: number;
  downloadUrl?: string;
  thumbnailUrl?: string;
}

export interface ProviderContent {
  url?: string;
  mediaType?: "video" | "image" | "text" | "iframe";
  description?: string;
  label?: string;
  children?: ProviderContentChild[];
}

export interface UseProviderContentResult {
  content: ProviderContent | null;
  loading: boolean;
  error: string | null;
}

export interface UseProviderContentParams {
  providerId?: string;
  providerPath?: string;
  providerContentPath?: string;
  fallbackUrl?: string;
}

// Helper to detect media type from URL
function detectMediaType(url: string): "video" | "image" | "iframe" {
  const lowerUrl = url.toLowerCase();
  const videoExtensions = [".mp4", ".webm", ".ogg", ".m3u8", ".mov", ".avi"];
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp"];

  if (videoExtensions.some(ext => lowerUrl.includes(ext))) return "video";
  if (imageExtensions.some(ext => lowerUrl.includes(ext))) return "image";
  if (lowerUrl.includes("/embed/")) return "iframe";
  return "image";
}

export function useProviderContent(params: UseProviderContentParams): UseProviderContentResult {
  const { providerId, providerPath, providerContentPath, fallbackUrl } = params;
  const [content, setContent] = useState<ProviderContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasFallback = useMemo(() => !!fallbackUrl, [fallbackUrl]);

  useEffect(() => {
    if (fallbackUrl) {
      setContent({ url: fallbackUrl, mediaType: detectMediaType(fallbackUrl) });
      setLoading(false);
      setError(null);
      return;
    }

    if (!providerId || !providerPath || !providerContentPath) {
      setContent(null);
      setLoading(false);
      return;
    }

    const fetchContent = async () => {
      setLoading(true);
      setError(null);

      try {
        const provider = getProvider(providerId);
        if (!provider) {
          setError(`Provider ${providerId} not found`);
          setLoading(false);
          return;
        }

        let instructions: Instructions | null = null;

        // Try client-side first (for providers that don't require auth)
        if (!provider.requiresAuth && provider.capabilities.instructions && provider.getInstructions) {
          instructions = await provider.getInstructions(providerPath);
        }

        // Fall back to API proxy for authenticated providers
        if (!instructions) {
          try {
            instructions = await ApiHelper.post(
              "/providerProxy/getInstructions",
              { providerId, path: providerPath },
              "DoingApi"
            );
          } catch (proxyError) {
            console.warn("API proxy failed:", proxyError);
          }
        }

        if (!instructions) {
          setError("Could not load content from provider");
          setLoading(false);
          return;
        }

        const item = navigateToPath(instructions, providerContentPath);

        if (item) {
          let downloadUrl = item.downloadUrl;
          const isSection = item.itemType === "section";

          if (!isSection && !downloadUrl && item.children && item.children.length > 0) {
            const childWithUrl = item.children.find(child => child.downloadUrl);
            if (childWithUrl) downloadUrl = childWithUrl.downloadUrl;
          }

          if (downloadUrl && !isSection) {
            setContent({
              url: downloadUrl,
              mediaType: detectMediaType(downloadUrl),
              description: item.content,
              label: item.label
            });
          } else if (item.children && item.children.length > 0) {
            const children: ProviderContentChild[] = item.children.map(child => {
              let childDownloadUrl = child.downloadUrl;
              let childThumbnail = child.thumbnail;
              if (!childDownloadUrl && child.children && child.children.length > 0) {
                const grandchildWithUrl = child.children.find(gc => gc.downloadUrl);
                if (grandchildWithUrl) {
                  childDownloadUrl = grandchildWithUrl.downloadUrl;
                  childThumbnail = childThumbnail || grandchildWithUrl.thumbnail;
                }
              }
              return {
                id: child.relatedId || child.id,
                label: child.label,
                description: child.content,
                seconds: child.seconds,
                downloadUrl: childDownloadUrl,
                thumbnailUrl: childThumbnail
              };
            });
            setContent({ description: item.content, label: item.label, children });
          } else {
            setContent({ description: item.content, label: item.label, mediaType: "text" });
          }
        } else {
          setError("Content not found at specified path");
        }
      } catch (err) {
        console.error("Error fetching provider content:", err);
        setError(err instanceof Error ? err.message : "Failed to load content");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [providerId, providerPath, providerContentPath, fallbackUrl, hasFallback]);

  return { content, loading, error };
}
