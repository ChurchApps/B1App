"use client";

import { Box, Container, Grid, Typography } from "@mui/material";
import { Locale } from "@churchapps/apphelper";
import { DateHelper } from "@churchapps/helpers";
import { useState, useEffect } from "react";
import { getDayOfYear, loadDailyVerse, type DailyVerse } from "../../../mobile/helpers/dailyVerses";
import { useAutoScroll } from "../../../mobile/helpers/useAutoScroll";

const WEEK_DAYS = 6;

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const imageUrl = (date: Date, shape: string) => `https://votd.org/v1/${getDayOfYear(date)}/${shape}.jpg`;

export function VotdPage() {
  const [shape, setShape] = useState("16x9");
  const [today, setToday] = useState<Date | null>(null);
  const [verse, setVerse] = useState<DailyVerse | null>(null);
  const [week, setWeek] = useState<{ date: Date; verse: DailyVerse | null }[]>([]);
  const [strip, setStrip] = useState<HTMLElement | null>(null);
  useAutoScroll(strip, { enabled: week.length > 0 });

  const getShape = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const ratio = width / height;

    const diff1x1 = Math.abs(ratio - 1);
    const diff16x9 = Math.abs(ratio - 1.777);
    const diff9x16 = Math.abs(ratio - 0.5625);
    let result = "1x1";
    if (diff16x9 < diff1x1) result = "16x9";
    else if (diff9x16 < diff1x1) result = "9x16";
    setShape(result);
  };

  useEffect(() => {
    getShape();
    const now = new Date();
    setToday(now);
    window.addEventListener("resize", getShape);

    let cancelled = false;
    loadDailyVerse(now).then((v) => { if (!cancelled) setVerse(v); }).catch(() => {});
    const dates = Array.from({ length: WEEK_DAYS }, (_, i) => daysAgo(i + 1));
    // Images still show if the verse text can't load.
    setWeek(dates.map((date) => ({ date, verse: null })));
    Promise.all(dates.map((d) => loadDailyVerse(d).catch((): DailyVerse | null => null))).then((verses) => {
      if (!cancelled) setWeek(dates.map((date, i) => ({ date, verse: verses[i] })));
    });
    return () => {
      cancelled = true;
      window.removeEventListener("resize", getShape);
    };
  }, []);

  const title = Locale.label("pageSlug.verseOfTheDay", "Verse of the Day");
  const longDate = (d: Date) => d.toLocaleDateString(DateHelper.locale, { weekday: "long", month: "long", day: "numeric" });

  return (
    <Container sx={{ py: 3 }}>
      <h1 style={{ textAlign: "center" }}>{title}</h1>
      {/* Client-only content avoids a hydration mismatch on the date-based image. */}
      {!today ? <Box sx={{ minHeight: 200 }} /> : (
        <>
          <Grid container spacing={4} alignItems="center" data-testid="votd-today">
            <Grid size={{ xs: 12, md: 7 }}>
              <Box sx={{ borderRadius: 2, overflow: "hidden", bgcolor: "grey.900", display: "flex", justifyContent: "center" }}>
                {/* A tall 9x16 picture would be a sliver at 50vh, so portrait screens get the square one. */}
                <img
                  src={imageUrl(today, shape === "9x16" ? "1x1" : shape)}
                  alt={verse ? `${verse.reference} — ${title}` : title}
                  style={{ display: "block", width: "100%", maxHeight: "50vh", objectFit: "contain" }}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Typography data-testid="votd-today-text" sx={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontSize: { xs: 22, md: 28 }, lineHeight: 1.4 }}>
                {verse ? <>&ldquo;{verse.text}&rdquo;</> : null}
              </Typography>
              {verse && <Typography sx={{ mt: 1.5, fontWeight: 600 }}>{verse.reference}</Typography>}
              <Typography sx={{ mt: 0.5, color: "text.secondary" }}>{longDate(today)}</Typography>
            </Grid>
          </Grid>

          <Typography component="h2" variant="h5" sx={{ mt: 5, mb: 2 }}>{Locale.label("pageSlug.thisWeek", "This week")}</Typography>
          <Box
            ref={setStrip}
            data-testid="votd-week-strip"
            sx={{ display: "flex", gap: 2, overflowX: "auto", scrollSnapType: "x mandatory", pb: 1, "&::-webkit-scrollbar": { display: "none" }, scrollbarWidth: "none" }}
          >
            {week.map(({ date, verse: v }) => (
              <Box key={date.toDateString()} data-testid="votd-week-day" sx={{ flex: "0 0 280px", scrollSnapAlign: "start", border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden", bgcolor: "background.paper" }}>
                <img src={imageUrl(date, "16x9")} alt={v ? `${v.reference} — ${title}` : title} loading="lazy" style={{ display: "block", width: "100%", aspectRatio: "16 / 9", objectFit: "cover" }} />
                <Box sx={{ p: 2 }}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>{date.toLocaleDateString(DateHelper.locale, { weekday: "short", month: "short", day: "numeric" })}</Typography>
                  <Typography sx={{ fontWeight: 600 }}>{v?.reference}</Typography>
                  <Typography variant="body2" sx={{ fontStyle: "italic", mt: 0.5 }}>{v?.text}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </>
      )}
    </Container>
  );
}
