import { Box, Typography } from "@mui/material";
import { NonAuthDonationWrapper } from "@churchapps/apphelper-website";

interface Props {
  churchId: string
}
export function GiveNowPanel(props: Props) {
  return (
    <Box sx={{ paddingX: 5, paddingTop: 3 }}>
      <Typography variant="h5" fontWeight="bold">
        My Donation
      </Typography>
      <NonAuthDonationWrapper
        churchId={props.churchId}
        mainContainerCssProps={{ sx: { boxShadow: "none", paddingY: 3 } }}
        showHeader={false}
      />
    </Box>
  );
}
