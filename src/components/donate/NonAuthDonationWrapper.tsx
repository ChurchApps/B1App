"use client";

import { useState } from "react";
import { NonAuthDonation } from "@churchapps/apphelper-donations";
import { EnvironmentHelper } from "@/helpers";
import type { PaperProps } from "@mui/material/Paper";
import { Box, Typography } from "@mui/material";

interface Props {
  churchId?: string;
  mainContainerCssProps?: PaperProps;
  showHeader?: boolean;
  recaptchaSiteKey?: string;
  churchLogo?: string;
}

export const NonAuthDonationWrapper: React.FC<Props> = (props) => {
  const [initialized, setInitialized] = useState(false);
  const [siteKey, setSiteKey] = useState<string>("");

  // Initialize on mount, not in useEffect to ensure it happens before child renders
  if (typeof window !== 'undefined' && !initialized) {
    EnvironmentHelper.init();
    // Access env var only on client to avoid SSR/hydration issues
    setSiteKey(props.recaptchaSiteKey || process.env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY || "");
    setInitialized(true);
  }

  // Don't render until initialized to avoid API errors
  if (!initialized) {
    return null;
  }

  if (!siteKey) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">
          Unable to load donation form: reCAPTCHA site key is missing
        </Typography>
      </Box>
    );
  }

  return <NonAuthDonation {...props} churchId={props.churchId} recaptchaSiteKey={siteKey} />;
};
