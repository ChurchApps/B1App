import { Box, Icon, Typography, Button } from "@mui/material";
import Link from "next/link";
import { SuccessIconContainer, EmptyStateCard, colors } from "./CheckinStyles";

export function CheckinComplete() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", paddingY: 6 }}>
      <EmptyStateCard sx={{ maxWidth: 500, width: "100%" }}>
        <SuccessIconContainer>
          <Icon sx={{ fontSize: 48, color: colors.success }}>check_circle</Icon>
        </SuccessIconContainer>
        <Typography variant="h4" sx={{ color: colors.textPrimary, fontWeight: 700, marginBottom: 2 }}>
          Check-in Complete!
        </Typography>
        <Typography variant="body1" sx={{ color: colors.textSecondary, marginBottom: 3 }}>
          Your attendance has been saved. Thank you for checking in!
        </Typography>
        <Link href="/my/timeline" style={{ textDecoration: "none" }}>
          <Button
            variant="contained"
            fullWidth
            sx={{
              backgroundColor: colors.primary,
              borderRadius: 3,
              height: 48,
              fontWeight: 600,
              "&:hover": { backgroundColor: colors.primaryHover }
            }}
          >
            Back to My Page
          </Button>
        </Link>
      </EmptyStateCard>
    </Box>
  );
}
