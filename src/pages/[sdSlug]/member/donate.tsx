import Link from "next/link";
import { Icon, Grid, Typography, Button } from "@mui/material";
import { ConfigHelper, WrapperPageProps } from "@/helpers";
import { Wrapper } from "@/components";
import { GetStaticPaths, GetStaticProps } from "next";
import { DonationPage as BaseDonationPage, NonAuthDonation, UserHelper, AppearanceHelper } from "@churchapps/apphelper";


export default function Donate(props: WrapperPageProps) {
  return (
    <Wrapper config={props.config}>
      <h1>
        <Icon>volunteer_activism</Icon>Give
      </h1>
      {UserHelper.currentUserChurch?.person?.id
        ? (
          <BaseDonationPage personId={UserHelper.currentUserChurch?.person?.id} appName="B1App" church={props.config.church} churchLogo={AppearanceHelper.getLogo(props?.config?.appearance, "", "", props?.config?.appearance?.primaryColor || "#FFF")} />
        )
        : (
          <>
            <Grid container spacing={3}>
              <Grid item md={8} xs={12}>
                <NonAuthDonation churchId={props.config.church.id} recaptchaSiteKey={process.env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY} churchLogo={AppearanceHelper.getLogo(props?.config?.appearance, "", "", props?.config?.appearance?.primaryColor || "#FFF")} />
              </Grid>
              <Grid item md={4} xs={12}>
                <Typography
                  component="h3"
                  sx={{ textAlign: "center", fontSize: "28px", fontWeight: 500, lineHeight: 1.2, margin: "0 0 8px 0" }}
                >
                Manage Donations
                </Typography>
                <p style={{ marginTop: 0 }}>Please login to manage donations</p>
                <Link href="/login/?returnUrl=/member/donate">
                  <Button sx={{ fontSize: "16px", textTransform: "capitalize" }} fullWidth variant="contained">
                  Login
                  </Button>
                </Link>
              </Grid>
            </Grid>
          </>
        )}
    </Wrapper>
  );
}


export const getStaticPaths: GetStaticPaths = async () => {
  const paths:any = [];
  return { paths, fallback: "blocking", };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const config = await ConfigHelper.load(params.sdSlug.toString());
  return { props: { config }, revalidate: 30 };
};
