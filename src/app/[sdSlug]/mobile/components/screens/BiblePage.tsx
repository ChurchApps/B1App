"use client";

import React, { useEffect, useState } from "react";
import { Box, Button, Icon, Typography } from "@mui/material";
import { mobileTheme } from "../mobileTheme";
import "@youversion/platform-react-ui/styles.css";

/**
 * Last-selection persistence key. Shared across /mobile/bible sessions so a
 * returning user re-enters the reader on the same book/chapter/translation
 * rather than the hard-coded Genesis-1/NIrV default the previous biblia.com
 * iframe used.
 */
const STORAGE_KEY = "b1.mobile.bible.selection";

type Selection = {
  book: string;
  chapter: string;
  versionId: number;
};

const DEFAULT_SELECTION: Selection = {
  book: "GEN",
  chapter: "1",
  versionId: 111 // YouVersion NIV; previous NIrV (biblia) has no direct YV equivalent we can hard-pick, NIV is the closest common default.
};

const loadSelection = (): Selection => {
  if (typeof window === "undefined") return DEFAULT_SELECTION;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SELECTION;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.book === "string" &&
      typeof parsed?.chapter === "string" &&
      typeof parsed?.versionId === "number"
    ) {
      return parsed as Selection;
    }
  } catch {
    /* corrupt JSON — fall through to default */
  }
  return DEFAULT_SELECTION;
};

const saveSelection = (sel: Selection) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sel));
  } catch {
    /* quota / private mode — non-fatal */
  }
};

/**
 * Error boundary around the YouVersion reader. Any runtime failure inside the
 * SDK surfaces the fallback card instead of crashing the whole mobile shell.
 */
class BibleErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    // Intentionally quiet — fallback UI already communicates the failure.
    if (process.env.NODE_ENV !== "production") {

      console.warn("[BiblePage] YouVersion reader crashed:", error);
    }
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const FallbackCard = () => {
  const tc = mobileTheme.colors;
  return (
    <Box sx={{
      p: `${mobileTheme.spacing.lg}px`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
      textAlign: "center"
    }}>
      <Box sx={{
        width: 72,
        height: 72,
        borderRadius: "36px",
        bgcolor: tc.iconBackground,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        mb: 2
      }}>
        <Icon sx={{ fontSize: 36, color: tc.primary }}>menu_book</Icon>
      </Box>
      <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: 1 }}>
        Bible reader unavailable
      </Typography>
      <Typography sx={{ fontSize: 14, color: tc.textMuted, mb: 3, maxWidth: 320 }}>
        The in-app reader failed to load. You can still open the Bible in your browser.
      </Typography>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "center" }}>
        <Button
          variant="contained"
          href="https://www.bible.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open Bible.com
        </Button>
        <Button
          variant="outlined"
          href="https://biblia.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open Biblia.com
        </Button>
      </Box>
    </Box>
  );
};

/**
 * YouVersion SDK is pulled via `require` so that a missing/broken module
 * degrades to the fallback card rather than failing the build-time import
 * graph of the mobile shell.
 */
const loadYouVersion = (): {
  BibleSDKProvider: React.ComponentType<any>;
  BibleReader: any;
} | null => {
  try {

    const mod = require("@youversion/platform-react-ui");
    if (mod?.BibleSDKProvider && mod?.BibleReader) {
      return { BibleSDKProvider: mod.BibleSDKProvider, BibleReader: mod.BibleReader };
    }
    return null;
  } catch {
    return null;
  }
};

export const BiblePage = () => {
  const tc = mobileTheme.colors;
  const [isClient, setIsClient] = useState(false);
  const [selection, setSelection] = useState<Selection>(DEFAULT_SELECTION);

  useEffect(() => {
    setSelection(loadSelection());
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) saveSelection(selection);
  }, [isClient, selection]);

  const yv = isClient ? loadYouVersion() : null;

  const apiKey =
    process.env.NEXT_PUBLIC_YOUVERSION_API_KEY ||
    "kcjG9986IOT5ThXvd3lJT1DArk9RBlYt6gzAVNA8Lnb9a8Ld";

  return (
    <Box sx={{
      bgcolor: tc.surface,
      minHeight: "100%",
      display: "flex",
      flexDirection: "column"
    }}>
      {!isClient && (
        <Box sx={{
          p: `${mobileTheme.spacing.md}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1
        }}>
          <Box sx={{
            width: 72,
            height: 72,
            borderRadius: "36px",
            bgcolor: tc.iconBackground,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 2
          }}>
            <Icon sx={{ fontSize: 36, color: tc.primary }}>menu_book</Icon>
          </Box>
          <Typography sx={{ fontSize: 16, color: tc.textMuted }}>
            Loading Bible...
          </Typography>
        </Box>
      )}

      {isClient && !yv && <FallbackCard />}

      {isClient && yv && (
        <BibleErrorBoundary fallback={<FallbackCard />}>
          <Box sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: `calc(100vh - ${mobileTheme.headerHeight}px)`,
            bgcolor: tc.surface
          }}>
            <yv.BibleSDKProvider appKey={apiKey}>
              <yv.BibleReader.Root
                versionId={selection.versionId}
                onVersionChange={(v: number) =>
                  setSelection((s) => ({ ...s, versionId: v }))
                }
                book={selection.book}
                onBookChange={(b: string) =>
                  setSelection((s) => ({ ...s, book: b, chapter: "1" }))
                }
                chapter={selection.chapter}
                onChapterChange={(c: string) =>
                  setSelection((s) => ({ ...s, chapter: c }))
                }
              >
                <yv.BibleReader.Toolbar border="bottom" />
                <Box sx={{
                  flex: 1,
                  overflowY: "auto",
                  p: `${mobileTheme.spacing.md}px`
                }}>
                  <yv.BibleReader.Content />
                </Box>
              </yv.BibleReader.Root>
            </yv.BibleSDKProvider>
          </Box>
        </BibleErrorBoundary>
      )}
    </Box>
  );
};
