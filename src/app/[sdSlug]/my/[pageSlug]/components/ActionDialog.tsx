"use client";
import React, { useEffect, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { EnvironmentHelper, ExternalVenueRefInterface } from "@/helpers";
import { useProviderContent } from "../hooks/useProviderContent";
import { ContentRenderer } from "./ContentRenderer";

interface Props {
  actionId: string;
  contentName?: string;
  onClose: () => void;
  externalRef?: ExternalVenueRefInterface | null;
  // Provider-based support
  providerId?: string;
  downloadUrl?: string;
  providerPath?: string;
  providerContentPath?: string;
  ministryId?: string;
}

export const ActionDialog: React.FC<Props> = (props) => {
  const [iframeHeight, setIframeHeight] = useState(typeof window !== "undefined" ? window.innerHeight * 0.7 : 500);

  const hasProviderData = !!props.providerId && !!props.providerPath && !!props.providerContentPath;
  const hasFallbackUrl = !!props.downloadUrl;

  // Provider-based content fetching
  const { content, loading, error } = useProviderContent({
    providerId: (hasProviderData || hasFallbackUrl) ? props.providerId : undefined,
    providerPath: hasProviderData ? props.providerPath : undefined,
    providerContentPath: hasProviderData ? props.providerContentPath : undefined,
    fallbackUrl: props.downloadUrl
  });

  // Legacy iframe URL (only when no provider data and no fallback URL)
  const legacyIframeUrl = (!hasProviderData && !hasFallbackUrl)
    ? (props.externalRef
      ? `${EnvironmentHelper.LessonsUrl}/embed/external/${props.externalRef.externalProviderId}/action/${props.actionId}`
      : `${EnvironmentHelper.LessonsUrl}/embed/action/${props.actionId}`)
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

  const renderContent = () => {
    // Legacy iframe mode
    if (legacyIframeUrl) {
      return (
        <iframe
          src={legacyIframeUrl}
          title="Action Content"
          style={{ width: "100%", height: iframeHeight, border: "none", display: "block" }}
        />
      );
    }

    // Provider-based rendering
    return (
      <ContentRenderer
        url={content?.url}
        mediaType={content?.mediaType}
        title={props.contentName}
        description={content?.description}
        loading={loading}
        error={error || undefined}
        iframeHeight={iframeHeight}
      />
    );
  };

  return (
    <Dialog open={true} onClose={props.onClose} fullWidth maxWidth="lg">
      <DialogTitle>{props.contentName || "Action"}</DialogTitle>
      <DialogContent sx={{ p: 0, overflow: "hidden" }}>
        {renderContent()}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={props.onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
