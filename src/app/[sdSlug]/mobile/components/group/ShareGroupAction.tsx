"use client";

import React from "react";
import { Box, Button, Snackbar, Typography } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ShareIcon from "@mui/icons-material/Share";
import { QRCodeSVG } from "qrcode.react";
import { Locale } from "@churchapps/apphelper";
import type { GroupInterface } from "@churchapps/helpers";
import { mobileTheme } from "../mobileTheme";
import { Sheet } from "../kit";

const tc = mobileTheme.colors;

// The group's page as a QR code and a link. Whoever opens it joins or asks to join from that page.
export const ShareGroupAction = ({ group }: { group: GroupInterface }) => {
  const [open, setOpen] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState<string | null>(null);
  // Confidential and archived groups have no page for anyone else to open.
  if (!group.id || group.confidential || group.archived) return null;

  const url = typeof window !== "undefined" ? `${window.location.origin}/mobile/groups/${group.slug || group.id}` : "";
  const groupName = group.name || Locale.label("mobile.components.group");

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setSnackbar(Locale.label("mobile.details.linkCopied"));
        return;
      }
    } catch { /* fall through to the error message */ }
    setSnackbar(Locale.label("mobile.details.unableToShare"));
  };

  return (
    <>
      <Button variant="outlined" startIcon={<ShareIcon />} onClick={() => setOpen(true)} data-testid="group-share-button">
        {Locale.label("mobile.group.share")}
      </Button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={Locale.label("mobile.group.shareGroup").replace("{}", groupName)}
        maxWidth="xs"
        actions={(
          <>
            <Button variant="outlined" onClick={() => setOpen(false)}>{Locale.label("common.close")}</Button>
            <Button variant="contained" startIcon={<ContentCopyIcon />} onClick={handleCopy} data-testid="group-share-copy">{Locale.label("mobile.group.copyLink")}</Button>
          </>
        )}
      >
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }} data-testid="group-share-sheet">
          {/* QR codes need a light quiet zone to scan, even in dark mode. */}
          <Box sx={{ border: `1px solid ${tc.border}`, borderRadius: "10px", p: "16px", bgcolor: "#FFFFFF", lineHeight: 0 }}>
            <QRCodeSVG value={url} size={200} title={groupName} data-testid="group-share-qr" />
          </Box>
          <Typography sx={{ fontSize: 13.5, lineHeight: "19px", color: tc.textSecondary, textAlign: "center" }}>
            {Locale.label("mobile.group.shareGroupHint")}
          </Typography>
          <Typography sx={{ fontSize: 13.5, lineHeight: "19px", color: tc.text, textAlign: "center", overflowWrap: "anywhere" }} data-testid="group-share-url">{url}</Typography>
        </Box>
      </Sheet>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar || ""} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} />
    </>
  );
};
