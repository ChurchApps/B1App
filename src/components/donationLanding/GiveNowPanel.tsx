import { Box, Typography } from "@mui/material";
import { ConfigHelper } from "@/helpers";
import { NonAuthDonation } from "@/appBase/donationComponents/components/NonAuthDonation";

export function GiveNowPanel() {
  return (
    <Box sx={{ paddingX: 5, paddingTop: 3 }}>
      <Typography variant="h5" fontWeight="bold">
        My Donation
      </Typography>
      <NonAuthDonation
        churchId={ConfigHelper.churchId}
        mainContainerCssProps={{ sx: { boxShadow: "none", paddingY: 3 } }}
        showHeader={false}
      />
    </Box>
  );
}
