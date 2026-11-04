"use client";

import { Children, cloneElement, isValidElement, useEffect, useState, type ReactElement, type ReactNode } from "react";
import { Box } from "@mui/material";
import type { ResponsiveStyleValue } from "@mui/system";
import { useAutoScroll } from "@/app/[sdSlug]/mobile/helpers/useAutoScroll";

interface Props {
  enabled: boolean;
  testId: string;
  children: ReactNode;
  gap?: ResponsiveStyleValue<number | string>;
  tileWidth?: ResponsiveStyleValue<string>;
}

const DEFAULT_TILE_WIDTH = { xs: "100%", md: "calc(50% - 12px)" };

// How many copies of the first tiles fill one view after the last tile, or 0 when the row fits without scrolling.
const measureClones = (el: HTMLElement) => {
  const tiles = Array.from(el.children).filter((c) => !(c as HTMLElement).dataset.clone) as HTMLElement[];
  if (tiles.length === 0) return 0;
  const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
  const total = tiles.reduce((sum, t) => sum + t.offsetWidth, 0) + gap * (tiles.length - 1);
  if (total <= el.clientWidth + 1) return 0;
  const step = tiles[0].offsetWidth + gap;
  return Math.min(tiles.length, Math.ceil((el.clientWidth + gap) / step - 0.01));
};

// One row of tiles that steps along by itself and loops forward. Tiles fill the row on a phone and half of it
// from md up unless tileWidth says otherwise. When the row overflows it gets copies of its first tiles after the
// last one (so the loop can wrap forward) and a row of dots under it, one per tile, with the current one filled.
export const AutoScrollStrip = ({ enabled, testId, children, gap = 3, tileWidth = DEFAULT_TILE_WIDTH }: Props) => {
  const [strip, setStrip] = useState<HTMLElement | null>(null);
  const [cloneCount, setCloneCount] = useState(0);
  const { active, index, goTo } = useAutoScroll(strip, { enabled });
  const tiles = Children.toArray(children).filter(isValidElement) as ReactElement<Record<string, unknown>>[];

  useEffect(() => {
    if (!strip) return;
    const update = () => setCloneCount(measureClones(strip));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(strip);
    return () => observer.disconnect();
  }, [strip, tiles.length]);

  const clones = tiles.slice(0, cloneCount).map((tile, i) => (
    <Box key={`clone-${i}`} data-clone="true" aria-hidden="true" inert sx={{ display: "flex", pointerEvents: "none", "& > *": { flex: "1 1 auto", minWidth: 0 } }}>
      {cloneElement(tile, { "data-testid": undefined })}
    </Box>
  ));

  return (
    <>
      <Box ref={setStrip} data-testid={testId} data-autoscroll={active ? "on" : "off"}
        sx={{ display: "flex", gap, overflowX: "auto", scrollSnapType: "x mandatory", pb: 1, "& > *": { flex: "0 0 auto", width: tileWidth, scrollSnapAlign: "start" }, "&::-webkit-scrollbar": { display: "none" }, scrollbarWidth: "none" }}>
        {tiles}
        {clones}
      </Box>
      {cloneCount > 0 && (
        <Box data-testid={`${testId}-dots`} sx={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 1, mt: 1 }}>
          {tiles.map((tile, i) => (
            <Box key={tile.key ?? i} component="button" type="button" onClick={() => goTo(i)}
              aria-label={`Go to item ${i + 1} of ${tiles.length}`} aria-current={i === index ? "true" : undefined}
              sx={{ width: 10, height: 10, p: 0, borderRadius: "50%", cursor: "pointer", border: "1.5px solid", borderColor: i === index ? "text.primary" : "text.secondary", bgcolor: i === index ? "text.primary" : "transparent", transition: "background-color 200ms ease" }} />
          ))}
        </Box>
      )}
    </>
  );
};
