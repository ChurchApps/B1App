"use client";
import React, { useEffect, useState, useRef } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { EnvironmentHelper, ExternalVenueRefInterface } from "@/helpers";

interface Props {
  actionId: string;
  actionName?: string;
  externalRef?: ExternalVenueRefInterface | null;
  onClose: () => void;
}

export const ActionDialog: React.FC<Props> = (props) => {
  const iframeUrl = props.externalRef
    ? `${EnvironmentHelper.LessonsUrl}/embed/external/${props.externalRef.externalProviderId}/action/${props.actionId}`
    : `${EnvironmentHelper.LessonsUrl}/embed/action/${props.actionId}`;
  const [iframeHeight, setIframeHeight] = useState(typeof window !== "undefined" ? window.innerHeight * 0.7 : 500);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "lessonActionHeight" && typeof event.data.height === "number") {
        const contentHeight = event.data.height + 20;
        const minHeight = window.innerHeight * 0.7;
        setIframeHeight(Math.max(contentHeight, minHeight));
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <Dialog open={true} onClose={props.onClose} fullWidth maxWidth="lg">
      <DialogTitle>{props.actionName || "Action"}</DialogTitle>
      <DialogContent sx={{ p: 0, overflow: "hidden" }}>
        <iframe
          ref={iframeRef}
          src={iframeUrl}
          title="Action Content"
          style={{
            width: "100%",
            height: iframeHeight,
            border: "none",
            display: "block"
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={props.onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
