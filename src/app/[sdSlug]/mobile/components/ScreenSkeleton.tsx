"use client";

import { Box } from "@mui/material";
import { mobileTheme } from "./mobileTheme";
import { Plate, PlateSection } from "./kit";

const Bar = ({ width, height = 14 }: { width: string; height?: number }) => (
  <Box sx={{ width, height, borderRadius: "4px", bgcolor: mobileTheme.colors.surfaceVariant, "& + &": { mt: "10px" } }} />
);

export function ScreenSkeleton() {
  return (
    <Box aria-busy="true">
      <Box sx={{ px: { xs: "16px", md: 0 }, pt: { xs: "4px", md: 0 }, pb: { xs: "18px", md: "24px" } }}>
        <Bar width="45%" height={32} />
      </Box>
      <Plate>
        {[0, 1, 2].map((i) => (
          <PlateSection key={i}>
            <Bar width="30%" height={12} />
            <Bar width="85%" />
            <Bar width="60%" />
          </PlateSection>
        ))}
      </Plate>
    </Box>
  );
}
