"use client";

import Link from "next/link";
import { Icon, Grid, Typography, Button } from "@mui/material";
import { WrapperPageProps } from "@/helpers";
import { NonAuthDonation, UserHelper, AppearanceHelper } from "@churchapps/apphelper";
import { BaseDonationPage } from "@/components/donate/BaseDonationPage";

export function DonateClient(props: WrapperPageProps) {
  return (
    <>
      <h1>
        <Icon>volunteer_activism</Icon> Give
      </h1>
      {UserHelper.currentUserChurch?.person?.id
        ? (
          <>

            <BaseDonationPage
              personId={UserHelper.currentUserChurch?.person?.id}
              appName="B1App"
              church={props.config.church}
              churchLogo={AppearanceHelper.getLogo(
                props?.config?.appearance,
                "",
                "",
                "#FFF"
              )}
            />
          </>
        )
        : (
          <>
            <Grid container spacing={3}>
              <Grid item md={8} xs={12}>
                <NonAuthDonation
                  churchId={props.config.church.id}
                  recaptchaSiteKey={process.env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY}
                  churchLogo={AppearanceHelper.getLogo(
                    props?.config?.appearance,
                    "",
                    "",
                    "#FFF"
                  )}
                />
              </Grid>
              <Grid item md={4} xs={12}>
                <Typography
                  component="h3"
                  sx={{ textAlign: "center", fontSize: "30px", fontWeight: 500, lineHeight: 1.2, margin: "0 0 8px 0" }}
                >
                Manage Donations
                </Typography>
                <a href="https://support.churchapps.org/b1/portal/donations/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline", textUnderlineOffset: 2, display: "flex", justifyContent: "center", alignItems: "center", fontSize: "15px" }}>
                  <p>Instructions for ACH Payment</p>
                  <Icon sx={{ fontSize: "18px !important", marginLeft: 0.5 }}>open_in_new</Icon>
                </a>
                <p style={{ textAlign: "center", fontSize: "12.5px", marginBottom: 3, fontStyle: "italic" }}>Please login to manage donations</p>
                <Link href="/login/?returnUrl=/member/donate">
                  <Button sx={{ fontSize: "16px", textTransform: "capitalize" }} fullWidth variant="contained">
                  Login
                  </Button>
                </Link>
              </Grid>
            </Grid>
          </>
        )}
    </>
  );
}
