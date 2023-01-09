import Link from "next/link";
import { Icon, Grid, Typography, Button } from "@mui/material";
import { PersonHelper, ConfigHelper } from "@/helpers";
import { DonationPage as BaseDonationPage, NonAuthDonation, Wrapper } from "@/components";

export default function Donate() {
  return (
    <Wrapper>
      <h1>
        <Icon>volunteer_activism</Icon>Give
      </h1>
      {PersonHelper.person?.id ? (
        <BaseDonationPage personId={PersonHelper.person.id} appName="B1App" />
      ) : (
        <>
          <Grid container spacing={3}>
            <Grid item md={8} xs={12}>
              <NonAuthDonation churchId={ConfigHelper.churchId} />
            </Grid>
            <Grid item md={4} xs={12}>
              <Typography
                component="h3"
                sx={{ textAlign: "center", fontSize: "28px", fontWeight: 500, lineHeight: 1.2, margin: "0 0 8px 0" }}
              >
                Manage Donations
              </Typography>
              <p style={{ marginTop: 0 }}>Please login to manage donations</p>
              <Link href="/login/?returnUrl=/donate">
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
