"use client";

import React from "react";
import { Container } from "@mui/material";
import { NonAuthDonationWrapper } from "@churchapps/apphelper/website";

// Always the guest form: a framed page has no member session, and the member giving screen is not an embed
// route. The form reads ?fundId=, ?amount= and ?recurring= itself, as it does on the public donate page.
export function EmbedDonate({ churchId }: { churchId: string }) {
  // Stripe Elements + reCAPTCHA read browser-only state during render, mismatching the SSR snapshot. Defer until mount.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  return <Container data-testid="embed-donate">{mounted && <NonAuthDonationWrapper churchId={churchId} showHeader={false} />}</Container>;
}
