import { Box } from "@mui/material";
import { mobileTheme } from "./mobileTheme";

export function ScreenSkeleton() {
  const tc = mobileTheme.colors;
  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px` }}>
      <Box sx={{ bgcolor: tc.surfaceVariant, height: 160, borderRadius: `${mobileTheme.radius.lg}px`, mb: 2 }} />
      <Box sx={{ bgcolor: tc.surfaceVariant, height: 80, borderRadius: `${mobileTheme.radius.md}px`, mb: 1.5 }} />
      <Box sx={{ bgcolor: tc.surfaceVariant, height: 80, borderRadius: `${mobileTheme.radius.md}px`, mb: 1.5 }} />
      <Box sx={{ bgcolor: tc.surfaceVariant, height: 80, borderRadius: `${mobileTheme.radius.md}px` }} />
    </Box>
  );
}
