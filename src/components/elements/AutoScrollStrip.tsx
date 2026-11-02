"use client";

import { useState, type ReactNode } from "react";
import { Box } from "@mui/material";
import { useAutoScroll } from "@/app/[sdSlug]/mobile/helpers/useAutoScroll";

interface Props { enabled: boolean; testId: string; children: ReactNode; }

// One row of tiles that steps along by itself. Tiles fill the row on a phone and half of it from md up,
// so three or more tiles overflow a desktop row and scroll.
export const AutoScrollStrip = ({ enabled, testId, children }: Props) => {
  const [strip, setStrip] = useState<HTMLElement | null>(null);
  useAutoScroll(strip, { enabled });
  return (
    <Box ref={setStrip} data-testid={testId}
      sx={{ display: "flex", gap: 3, overflowX: "auto", scrollSnapType: "x mandatory", pb: 1, "& > *": { flex: { xs: "0 0 100%", md: "0 0 calc(50% - 12px)" }, scrollSnapAlign: "start" }, "&::-webkit-scrollbar": { display: "none" }, scrollbarWidth: "none" }}>
      {children}
    </Box>
  );
};
