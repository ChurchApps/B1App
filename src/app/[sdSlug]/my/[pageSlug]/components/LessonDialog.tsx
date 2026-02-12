"use client";
import React, { useEffect, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography, Box, Divider, IconButton } from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { MarkdownPreviewLight } from "@churchapps/apphelper-markdown";
import { EnvironmentHelper, ExternalVenueRefInterface } from "@/helpers";
import { useProviderContent, type ProviderContentChild } from "../hooks/useProviderContent";
import { ContentRenderer } from "./ContentRenderer";

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

interface Props {
  sectionId: string;
  sectionName?: string;
  externalRef?: ExternalVenueRefInterface | null;
  onClose: () => void;
  // Provider-based section support
  providerId?: string;
  downloadUrl?: string;
  providerPath?: string;
  providerContentPath?: string;
  ministryId?: string;
}

export const LessonDialog: React.FC<Props> = (props) => {
  const [iframeHeight, setIframeHeight] = useState(typeof window !== "undefined" ? window.innerHeight * 0.7 : 500);
  const [selectedChild, setSelectedChild] = useState<ProviderContentChild | null>(null);

  const hasProviderData = !!props.providerId && !!props.providerPath && !!props.providerContentPath;

  // Provider-based content fetching
  const { content, loading, error } = useProviderContent({
    providerId: hasProviderData ? props.providerId : undefined,
    providerPath: hasProviderData ? props.providerPath : undefined,
    providerContentPath: hasProviderData ? props.providerContentPath : undefined,
    fallbackUrl: hasProviderData ? props.downloadUrl : undefined
  });

  // Legacy iframe URL
  const legacyIframeUrl = !hasProviderData
    ? (props.externalRef
      ? `${EnvironmentHelper.LessonsUrl}/embed/external/${props.externalRef.externalProviderId}/section/${props.sectionId}`
      : `${EnvironmentHelper.LessonsUrl}/embed/section/${props.sectionId}`)
    : null;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data?.height === "number") {
        const contentHeight = event.data.height + 20;
        const minHeight = window.innerHeight * 0.7;
        setIframeHeight(Math.max(contentHeight, minHeight));
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const hasChildren = content?.children && content.children.length > 0;

  const renderContent = () => {
    // Legacy iframe mode
    if (legacyIframeUrl) {
      return (
        <iframe
          src={legacyIframeUrl}
          title="Lesson Content"
          style={{ width: "100%", height: iframeHeight, border: "none", display: "block" }}
        />
      );
    }

    // Provider-based rendering
    if (loading) return <ContentRenderer loading={true} />;
    if (error) return <ContentRenderer error={error} />;

    // Child drill-down
    if (selectedChild) {
      const childUrl = selectedChild.downloadUrl;
      if (childUrl) {
        return (
          <ContentRenderer
            url={childUrl}
            mediaType={detectMediaType(childUrl)}
            title={selectedChild.label}
            description={selectedChild.description}
            iframeHeight={iframeHeight}
          />
        );
      }
      return (
        <Box sx={{ p: 3 }}>
          {selectedChild.description ? (
            <MarkdownPreviewLight value={selectedChild.description} />
          ) : (
            <Typography color="text.secondary" sx={{ textAlign: "center" }}>No preview available for this item.</Typography>
          )}
        </Box>
      );
    }

    // Direct content URL
    if (content?.url) {
      return (
        <ContentRenderer
          url={content.url}
          mediaType={content.mediaType}
          title={props.sectionName}
          description={content.description}
          iframeHeight={iframeHeight}
        />
      );
    }

    // Children list (section with actions)
    if (hasChildren) {
      return (
        <Box sx={{ p: 2 }}>
          {content.description && (
            <Box sx={{ mb: 2 }}>
              <MarkdownPreviewLight value={content.description} />
            </Box>
          )}
          <Box>
            {content.children!.map((child, index) => (
              <React.Fragment key={child.id || index}>
                {index > 0 && <Divider />}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    py: 1.5,
                    px: 1,
                    "&:hover": { bgcolor: "action.hover" },
                    borderRadius: 1
                  }}
                  onClick={() => setSelectedChild(child)}
                >
                  {child.thumbnailUrl && (
                    <Box
                      component="img"
                      src={child.thumbnailUrl}
                      alt=""
                      sx={{ width: 60, height: 34, objectFit: "cover", borderRadius: 1, mr: 1.5, flexShrink: 0 }}
                    />
                  )}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{child.label}</Typography>
                    {child.description && (
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>{child.description}</Typography>
                    )}
                  </Box>
                </Box>
              </React.Fragment>
            ))}
          </Box>
        </Box>
      );
    }

    // No content
    return (
      <Box sx={{ p: 4, textAlign: "center", minHeight: 200, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Typography color="text.secondary">Preview not available for this section.</Typography>
      </Box>
    );
  };

  return (
    <Dialog open={true} onClose={props.onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {selectedChild && (
          <IconButton size="small" onClick={() => setSelectedChild(null)} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
        )}
        {selectedChild ? selectedChild.label : (props.sectionName || "Lesson Section")}
      </DialogTitle>
      <DialogContent sx={{ p: 0, overflow: "hidden" }}>
        {renderContent()}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={selectedChild ? () => setSelectedChild(null) : props.onClose}>
          {selectedChild ? "Back" : "Close"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
