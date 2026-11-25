"use client";

import React, { useEffect, useRef, useState } from "react";
import ShareIcon from "@mui/icons-material/Share";
import DownloadIcon from "@mui/icons-material/Download";
import { shareLink } from "@/helpers/shareLink";

interface Props {
  title: string;
  downloadHref: string | null;
  shareText: string;
}

const actionStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6, background: "none", font: "inherit", fontSize: 14, color: "inherit", textDecoration: "none", cursor: "pointer" };

// Share and Download beside the public sermon page's player.
export function SermonActions({ title, downloadHref, shareText }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const showStatus = (text: string) => {
    setStatus(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus(null), 3000);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const result = await shareLink({ title, text: `${shareText} ${url}`, url });
    if (result === "copied") showStatus("Link copied to clipboard");
    else if (result === "failed") showStatus("Unable to share on this device");
  };

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: 8 }}>
      <button type="button" data-testid="sermon-share" onClick={handleShare} style={actionStyle}>
        <ShareIcon fontSize="small" /> Share
      </button>
      {downloadHref && (
        <a data-testid="sermon-download" href={downloadHref} style={actionStyle}>
          <DownloadIcon fontSize="small" /> Download audio
        </a>
      )}
      {status && <span role="status" data-testid="sermon-share-status" style={{ fontSize: 14, color: "#666" }}>{status}</span>}
    </div>
  );
}
