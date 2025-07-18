import { Box, Typography } from "@mui/material";
import { NonAuthDonation } from "@churchapps/apphelper/dist/donationComponents/components/NonAuthDonation";

interface Props {
  churchId: string
}
export function GiveNowPanel(props: Props) {
  return (
    <Box sx={{ paddingX: 5, paddingTop: 3 }}>
      <Typography variant="h5" fontWeight="bold">
        My Donation
      </Typography>
      <NonAuthDonation
        churchId={props.churchId}
        recaptchaSiteKey={process.env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY}
        mainContainerCssProps={{ sx: { boxShadow: "none", paddingY: 3 } }}
        showHeader={false}
        data-testid="non-auth-donation"
      />
    </Box>
  );
}
