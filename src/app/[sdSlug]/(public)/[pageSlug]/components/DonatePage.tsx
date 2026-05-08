"use client";

import React from "react";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { NonAuthDonationWrapper } from "@churchapps/apphelper/website";
import { UserHelper, Locale } from "@churchapps/apphelper";
import { Button, Container, Grid, Icon, Link, Typography } from "@mui/material";
import { redirect } from "next/navigation";

type Props = { config?: ConfigurationInterface; };

export function DonatePage(props:Props) {

  // Stripe Elements + reCAPTCHA inside NonAuthDonationWrapper read browser-only
  // state during render, mismatching the SSR snapshot. Defer until mount.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  if (UserHelper.currentUserChurch?.person?.id) redirect("/mobile/donate");
  return <>
    <Container>
      <h1>{Locale.label("pageSlug.donate")}</h1>
      <Grid container spacing={3}>
        <Grid size={{ md: 8, xs: 12 }}>
          {mounted && <NonAuthDonationWrapper churchId={props.config.church.id} showHeader={false} />}
        </Grid>
        <Grid size={{ md: 4, xs: 12 }}>
          <Typography component="h3" sx={{ textAlign: "center", fontSize: "30px", fontWeight: 500, lineHeight: 1.2, margin: "0 0 8px 0" }}>{Locale.label("pageSlug.manageDonations")}</Typography>
          <a href="https://support.churchapps.org/b1/portal/donations/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline", textUnderlineOffset: 2, display: "flex", justifyContent: "center", alignItems: "center", fontSize: "15px" }} data-testid="donate-instructions-link">
            <p>{Locale.label("pageSlug.achInstructions")}</p>
            <Icon sx={{ fontSize: "18px !important", marginLeft: 0.5 }}>open_in_new</Icon>
          </a>
          <p style={{ textAlign: "center", fontSize: "12.5px", marginBottom: 3, fontStyle: "italic" }}>{Locale.label("pageSlug.loginToManageDonations")}</p>
          <Link href="/login/?returnUrl=/donate">
            <Button sx={{ fontSize: "16px", textTransform: "capitalize" }} fullWidth variant="contained" data-testid="donate-login-button">{Locale.label("login.login")}</Button>
          </Link>
        </Grid>
      </Grid>
    </Container>
  </>;


}
