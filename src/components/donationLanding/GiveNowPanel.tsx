"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { NonAuthDonationWrapper } from "@churchapps/apphelper/website";
import { Locale } from "@churchapps/apphelper";

interface Props {
  churchId: string
}
export function GiveNowPanel(props: Props) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  return (
    <Box sx={{ paddingX: 5, paddingTop: 3 }}>
      <Typography variant="h5" fontWeight="bold">
        {Locale.label("donationLanding.myDonation")}
      </Typography>
      {mounted && (
        <NonAuthDonationWrapper
          churchId={props.churchId}
          mainContainerCssProps={{ sx: { boxShadow: "none", paddingY: 3 } }}
          showHeader={false}
        />
      )}
    </Box>
  );
}
