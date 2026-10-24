"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import ShareIcon from "@mui/icons-material/Share";
import ImageIcon from "@mui/icons-material/Image";
import DownloadIcon from "@mui/icons-material/Download";
import { Locale } from "@churchapps/apphelper";
import { DateHelper } from "@churchapps/helpers";
import { mobileTheme } from "../mobileTheme";
import { BackVerb, PageHead, Plate, PlateSection, Row, RowList, Sheet, TextLink, useSliceView } from "../kit";
import { getDayOfYear, loadDailyVerse, type DailyVerse } from "../../helpers/dailyVerses";
import { downloadVerseImage, groupByMonth, pastDatesThisYear, shareVerseImage, shareVerseText, type ShareResult } from "../../helpers/shareVerse";

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const getShape = () => {
  if (typeof window === "undefined") return "9x16";
  const ratio = window.innerWidth / window.innerHeight;
  const diff1x1 = Math.abs(ratio - 1);
  const diff16x9 = Math.abs(ratio - 1.777);
  const diff9x16 = Math.abs(ratio - 0.5625);
  if (diff16x9 < diff1x1) return "16x9";
  if (diff9x16 < diff1x1) return "9x16";
  return "1x1";
};

export const VotdPage = () => {
  const tc = mobileTheme.colors;
  const [verse, setVerse] = useState<DailyVerse | null>(null);
  const [day, setDay] = useState<number | null>(null);
  const [shape, setShape] = useState("9x16");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [week, setWeek] = useState<{ date: Date; verse: DailyVerse }[]>([]);
  const [selected, setSelected] = useState<{ date: Date; verse: DailyVerse } | null>(null);
  const [past, setPast] = useState<{ date: Date; verse: DailyVerse | null }[]>([]);
  const [view, setView] = useSliceView();
  const showPast = view === "past";

  useEffect(() => {
    setDay(getDayOfYear());
    const onResize = () => setShape(getShape());
    const onVisible = () => { if (document.visibilityState === "visible") setDay(getDayOfYear()); };
    onResize();
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    if (day === null) return;
    let cancelled = false;
    loadDailyVerse().then((v) => { if (!cancelled) setVerse(v); });
    const dates = [1, 2, 3].map(daysAgo);
    Promise.all(dates.map((d) => loadDailyVerse(d))).then((verses) => {
      if (!cancelled) setWeek(verses.map((v, i) => ({ date: dates[i], verse: v })));
    });
    return () => { cancelled = true; };
  }, [day]);

  useEffect(() => {
    if (!showPast || day === null) return;
    let cancelled = false;
    const dates = pastDatesThisYear();
    setPast(dates.map((date) => ({ date, verse: null })));
    Promise.all(dates.map((d) => loadDailyVerse(d).catch((): DailyVerse | null => null))).then((verses) => {
      if (!cancelled) setPast(dates.map((date, i) => ({ date, verse: verses[i] })));
    });
    return () => { cancelled = true; };
  }, [showPast, day]);

  const imageUrl = useMemo(() => (day === null ? "" : `https://votd.org/v1/${day}/${shape}.jpg`), [day, shape]);
  const showImage = !!imageUrl && !imageError;

  const flashMessage = (message: string) => {
    setShareMessage(message);
    setTimeout(() => setShareMessage(null), 2500);
  };

  const report = (result: ShareResult) => {
    if (result === "copied") flashMessage(Locale.label("mobile.votd.copied"));
    else if (result === "failed") flashMessage(Locale.label("mobile.votd.unableToShare"));
  };

  const shareActions = (v: DailyVerse | null, d: number, withImage = true, labelToday = false) => (
    <>
      <Button variant="contained" onClick={async () => report(await shareVerseText(v, d, shape))} startIcon={<ShareIcon />} aria-label={labelToday ? Locale.label("mobile.screens.shareVotd") : undefined}>
        {Locale.label("mobile.votd.share")}
      </Button>
      {withImage && (
        <>
          <Button variant="outlined" onClick={async () => report(await shareVerseImage(v, d, shape))} startIcon={<ImageIcon />} data-testid="votd-share-image">
            {Locale.label("mobile.votd.shareImage")}
          </Button>
          <Button variant="text" onClick={async () => report(await downloadVerseImage(d, shape))} startIcon={<DownloadIcon />}>
            {Locale.label("mobile.votd.download")}
          </Button>
        </>
      )}
    </>
  );

  const today = day === null ? "" : new Date().toLocaleDateString(DateHelper.locale, { weekday: "long", month: "long", day: "numeric" });

  const status = shareMessage && <Typography role="status" sx={{ fontSize: 13.5, color: tc.textSecondary }}>{shareMessage}</Typography>;
  const shortDate = (d: Date) => d.toLocaleDateString(DateHelper.locale, { weekday: "short", month: "short", day: "numeric" });

  const sheet = (
    <Sheet open={!!selected} onClose={() => setSelected(null)} title={selected?.verse.reference || ""}>
      {selected && (
        <>
          <Box sx={{ borderRadius: "10px", overflow: "hidden", bgcolor: tc.primaryDeep, display: "flex", justifyContent: "center", mb: "14px" }}>
            <img
              src={`https://votd.org/v1/${getDayOfYear(selected.date)}/${shape}.jpg`}
              alt={`${selected.verse.reference} — Verse of the Day`}
              style={{ display: "block", maxWidth: "100%", maxHeight: "60vh", objectFit: "contain" }}
            />
          </Box>
          <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: tc.textSecondary, mb: "6px" }}>
            {selected.date.toLocaleDateString(DateHelper.locale, { weekday: "long", month: "long", day: "numeric" })}
          </Typography>
          <Typography sx={{ fontFamily: mobileTheme.fonts.serif, fontStyle: "italic", fontSize: 19, lineHeight: "28px", color: tc.text }}>
            &ldquo;{selected.verse.text}&rdquo;
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px", mt: "16px" }}>
            {shareActions(selected.verse, getDayOfYear(selected.date))}
            {status}
          </Box>
        </>
      )}
    </Sheet>
  );

  if (showPast) {
    return (
      <Box>
        <BackVerb label={Locale.label("mobile.components.back")} onClick={() => setView("")} />
        <PageHead title={Locale.label("mobile.votd.pastVerses")} />
        <Plate>
          {groupByMonth(past).map((group) => (
            <PlateSection key={group.key} title={group.month.toLocaleDateString(DateHelper.locale, { month: "long" })}>
              <RowList>
                {group.entries.map((entry) => (
                  <Row
                    key={entry.date.toDateString()}
                    data-testid="votd-past-row"
                    onClick={entry.verse ? () => setSelected({ date: entry.date, verse: entry.verse! }) : undefined}
                    title={shortDate(entry.date)}
                    subtitle={entry.verse?.reference}
                    chevron
                  />
                ))}
              </RowList>
            </PlateSection>
          ))}
        </Plate>
        {sheet}
      </Box>
    );
  }

  return (
    <Box>
      <PageHead title={Locale.label("mobile.screenTitles.votd")} lede={today || undefined}>
        {day !== null && shareActions(verse, day, showImage, true)}
        {!selected && status}
      </PageHead>
      <Plate>
        <PlateSection>
          {showImage && (
            <Box sx={{ borderRadius: "10px", overflow: "hidden", bgcolor: tc.primaryDeep, display: imageLoaded ? "flex" : "none", justifyContent: "center", mb: "18px" }}>
              <img
                src={imageUrl}
                alt={verse ? `${verse.reference} — Verse of the Day` : "Verse of the Day"}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                style={{ display: "block", maxWidth: "100%", maxHeight: "62vh", objectFit: "contain" }}
              />
            </Box>
          )}
          {verse && (
            <>
              <Typography sx={{ fontFamily: mobileTheme.fonts.serif, fontStyle: "italic", fontSize: 24, lineHeight: "34px", color: tc.text, maxWidth: 640 }}>
                &ldquo;{verse.text}&rdquo;
              </Typography>
              <Typography sx={{ mt: "8px", fontSize: 14, fontWeight: 600, color: tc.textSecondary }}>
                {verse.reference}
              </Typography>
            </>
          )}
        </PlateSection>
        {week.length > 0 && (
          <PlateSection title={Locale.label("mobile.votd.thisWeek")} action={<TextLink onClick={() => setView("past")}>{Locale.label("mobile.votd.pastVerses")}</TextLink>}>
            <RowList>
              {week.map((entry) => (
                <Row
                  key={entry.date.toDateString()}
                  data-testid="votd-week-row"
                  onClick={() => setSelected(entry)}
                  title={entry.verse.reference}
                  subtitle={`${shortDate(entry.date)} · ${entry.verse.text}`}
                  chevron
                />
              ))}
            </RowList>
          </PlateSection>
        )}
      </Plate>
      {sheet}
    </Box>
  );
};
