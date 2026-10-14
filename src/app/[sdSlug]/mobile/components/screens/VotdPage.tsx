"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import ShareIcon from "@mui/icons-material/Share";
import ImageIcon from "@mui/icons-material/Image";
import { Locale } from "@churchapps/apphelper";
import { DateHelper } from "@churchapps/helpers";
import { mobileTheme } from "../mobileTheme";
import { PageHead, Plate, PlateSection, Row, RowList } from "../kit";
import { getDayOfYear, loadDailyVerse, type DailyVerse } from "../../helpers/dailyVerses";

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

  const imageUrl = useMemo(() => (day === null ? "" : `https://votd.org/v1/${day}/${shape}.jpg`), [day, shape]);
  const showImage = !!imageUrl && !imageError;
  const shareText = verse ? `"${verse.text}" — ${verse.reference}` : "Verse of the Day";

  const flashMessage = (message: string) => {
    setShareMessage(message);
    setTimeout(() => setShareMessage(null), 2500);
  };

  const handleShare = async () => {
    const shareData = {
      title: "Verse of the Day",
      text: shareText,
      url: imageUrl || window.location.href
    };
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share(shareData);
        return;
      }
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
    }
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText}\n${shareData.url}`);
        flashMessage(Locale.label("mobile.votd.copied"));
      }
    } catch {
      flashMessage(Locale.label("mobile.votd.unableToShare"));
    }
  };

  // Shares the picture itself (same-origin copy, since votd.org has no CORS); downloads it where file sharing isn't supported.
  const handleShareImage = async () => {
    if (day === null) return;
    try {
      const res = await fetch(`/mobile/votd-image/${day}/${shape}`);
      if (!res.ok) throw new Error("Image unavailable");
      const blob = await res.blob();
      const file = new File([blob], "verse-of-the-day.jpg", { type: "image/jpeg" });
      const nav = navigator as any;
      if (nav.canShare?.({ files: [file] }) && nav.share) {
        await nav.share({ files: [file], text: shareText });
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      flashMessage(Locale.label("mobile.votd.unableToShare"));
    }
  };

  const today = day === null ? "" : new Date().toLocaleDateString(DateHelper.locale, { weekday: "long", month: "long", day: "numeric" });

  return (
    <Box>
      <PageHead title={Locale.label("mobile.screenTitles.votd")} lede={today || undefined}>
        <Button variant="contained" onClick={handleShare} startIcon={<ShareIcon />} aria-label={Locale.label("mobile.screens.shareVotd")}>
          {Locale.label("mobile.votd.share")}
        </Button>
        {showImage && (
          <Button variant="outlined" onClick={handleShareImage} startIcon={<ImageIcon />} data-testid="votd-share-image">
            {Locale.label("mobile.votd.shareImage")}
          </Button>
        )}
        {shareMessage && <Typography role="status" sx={{ fontSize: 13.5, color: tc.textSecondary }}>{shareMessage}</Typography>}
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
          <PlateSection title={Locale.label("mobile.votd.thisWeek")}>
            <RowList>
              {week.map(({ date, verse: v }) => (
                <Row
                  key={date.toDateString()}
                  title={v.reference}
                  subtitle={`${date.toLocaleDateString(DateHelper.locale, { weekday: "short", month: "short", day: "numeric" })} · ${v.text}`}
                  sx={{ "& .MuiTypography-root:last-of-type": { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }}
                />
              ))}
            </RowList>
          </PlateSection>
        )}
      </Plate>
    </Box>
  );
};
