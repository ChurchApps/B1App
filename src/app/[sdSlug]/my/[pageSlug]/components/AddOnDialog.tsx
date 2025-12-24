"use client";
import React, { useEffect, useState, useRef } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { EnvironmentHelper } from "@/helpers";

interface Props {
  addOnId: string;
  addOnName?: string;
  onClose: () => void;
}

export const AddOnDialog: React.FC<Props> = (props) => {
  const iframeUrl = `${EnvironmentHelper.LessonsUrl}/embed/addon/${props.addOnId}`;
  const [iframeHeight, setIframeHeight] = useState(typeof window !== "undefined" ? window.innerHeight * 0.7 : 500);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "lessonAddOnHeight" && typeof event.data.height === "number") {
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
      <DialogTitle>{props.addOnName || "Add-On"}</DialogTitle>
      <DialogContent sx={{ p: 0, overflow: "hidden" }}>
        <iframe
          ref={iframeRef}
          src={iframeUrl}
          title="Add-On Content"
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
