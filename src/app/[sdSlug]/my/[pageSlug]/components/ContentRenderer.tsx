"use client";
import React from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { MarkdownPreviewLight } from "@churchapps/apphelper-markdown";

interface ContentRendererProps {
  url?: string;
  mediaType?: "video" | "image" | "text" | "iframe";
  title?: string;
  description?: string;
  loading?: boolean;
  error?: string;
  iframeHeight?: number;
}

function isVideoUrl(url: string): boolean {
  const videoExtensions = [".mp4", ".webm", ".ogg", ".m3u8", ".mov", ".avi"];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext));
}

function isIframeUrl(url: string): boolean {
  return url.includes("/embed/");
}

function isImageUrl(url: string): boolean {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp"];
  return imageExtensions.some(ext => url.toLowerCase().includes(ext));
}

export const ContentRenderer: React.FC<ContentRendererProps> = ({
  url,
  mediaType,
  title,
  description,
  loading,
  error,
  iframeHeight = typeof window !== "undefined" ? window.innerHeight * 0.7 : 500
}) => {
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4, minHeight: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="error" gutterBottom>{error}</Typography>
        <Typography color="text.secondary" variant="body2">
          Unable to load preview. The content may require authentication or is temporarily unavailable.
        </Typography>
      </Box>
    );
  }

  if (!url) {
    if (description || mediaType === "text") {
      return (
        <Box sx={{ p: 3 }}>
          {description ? (
            <MarkdownPreviewLight value={description} />
          ) : (
            <Typography color="text.secondary" sx={{ textAlign: "center" }}>No content to display.</Typography>
          )}
        </Box>
      );
    }

    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="text.secondary">Preview not available for this content.</Typography>
      </Box>
    );
  }

  let effectiveMediaType = mediaType;
  if (!effectiveMediaType) {
    if (isVideoUrl(url)) effectiveMediaType = "video";
    else if (isIframeUrl(url)) effectiveMediaType = "iframe";
    else if (isImageUrl(url)) effectiveMediaType = "image";
    else effectiveMediaType = "image";
  }

  switch (effectiveMediaType) {
    case "video":
      return (
        <Box sx={{ width: "100%", display: "flex", justifyContent: "center", bgcolor: "black" }}>
          <video controls autoPlay={false} style={{ maxWidth: "100%", maxHeight: "70vh" }} src={url}>
            Your browser does not support the video tag.
          </video>
        </Box>
      );

    case "iframe":
      return (
        <iframe
          src={url}
          title={title || "Content Preview"}
          style={{ width: "100%", height: iframeHeight, border: "none", display: "block" }}
        />
      );

    case "text":
      return (
        <Box sx={{ p: 3 }}>
          {description ? (
            <MarkdownPreviewLight value={description} />
          ) : (
            <Typography color="text.secondary" sx={{ textAlign: "center" }}>No text content to display.</Typography>
          )}
        </Box>
      );

    case "image":
    default:
      return (
        <Box sx={{ width: "100%", display: "flex", justifyContent: "center", p: 2 }}>
          <img src={url} alt={title || "Preview"} style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }} />
        </Box>
      );
  }
};
