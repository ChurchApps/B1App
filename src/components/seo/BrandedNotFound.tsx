"use client";

import React from "react";
import Link from "next/link";
import { Box, Button, Typography } from "@mui/material";

interface Props { churchName?: string; logo?: string; homeUrl?: string; }

export function BrandedNotFound({ churchName, logo, homeUrl = "/" }: Props) {
  return (
    <Box sx={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", px: 3, py: 8 }}>
      {logo ? (
        <img src={logo} alt={churchName || "Home"} style={{ maxWidth: 280, maxHeight: 90, marginBottom: 32 }} />
      ) : null}
      <Typography variant="h1" sx={{ fontSize: { xs: 64, sm: 88 }, fontWeight: 700, lineHeight: 1 }}>404</Typography>
      <Typography variant="h5" sx={{ mt: 2, fontWeight: 600 }}>Page not found</Typography>
      <Typography sx={{ mt: 1.5, maxWidth: 460, color: "text.secondary" }}>
        {"We couldn't find the page you were looking for" + (churchName ? " on " + churchName + "'s site." : ".")}
      </Typography>
      <Button component={Link} href={homeUrl} variant="contained" sx={{ mt: 4 }}>
        {churchName ? "Return to " + churchName : "Return home"}
      </Button>
    </Box>
  );
}
