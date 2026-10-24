"use client";

import { Box, Button, Container, Dialog, DialogActions, DialogContent, Grid, Link, Snackbar, Stack, Typography } from "@mui/material";
import ShareIcon from "@mui/icons-material/Share";
import ImageIcon from "@mui/icons-material/Image";
import DownloadIcon from "@mui/icons-material/Download";
import { Locale } from "@churchapps/apphelper";
import { DateHelper } from "@churchapps/helpers";
import { useState, useEffect } from "react";
import { getDayOfYear, loadDailyVerse, type DailyVerse } from "../../../mobile/helpers/dailyVerses";
import { useAutoScroll } from "../../../mobile/helpers/useAutoScroll";
import { downloadVerseImage, groupByMonth, pastDatesThisYear, shareVerseImage, shareVerseText, type ShareResult } from "../../../mobile/helpers/shareVerse";

const WEEK_DAYS = 6;

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

// The website always shares the wide picture.
const SHARE_SHAPE = "16x9";

type DayEntry = { date: Date; verse: DailyVerse | null };

const imageUrl = (date: Date, shape: string) => `https://votd.org/v1/${getDayOfYear(date)}/${shape}.jpg`;

export function VotdPage() {
  const [shape, setShape] = useState("16x9");
  const [today, setToday] = useState<Date | null>(null);
  const [verse, setVerse] = useState<DailyVerse | null>(null);
  const [week, setWeek] = useState<DayEntry[]>([]);
  const [selected, setSelected] = useState<DayEntry | null>(null);
  const [past, setPast] = useState<DayEntry[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
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
  const shortDate = (d: Date) => d.toLocaleDateString(DateHelper.locale, { weekday: "short", month: "short", day: "numeric" });

  const report = (result: ShareResult) => {
    if (result === "copied") setMessage(Locale.label("mobile.votd.copied"));
    else if (result === "failed") setMessage(Locale.label("mobile.votd.unableToShare"));
  };

  const shareActions = (date: Date, v: DailyVerse | null) => {
    const day = getDayOfYear(date);
    return (
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mt: 2 }}>
        <Button variant="contained" startIcon={<ShareIcon />} onClick={async () => report(await shareVerseText(v, day, SHARE_SHAPE))}>{Locale.label("mobile.votd.share")}</Button>
        <Button variant="outlined" startIcon={<ImageIcon />} onClick={async () => report(await shareVerseImage(v, day, SHARE_SHAPE))}>{Locale.label("mobile.votd.shareImage")}</Button>
        <Button variant="text" startIcon={<DownloadIcon />} onClick={async () => report(await downloadVerseImage(day, SHARE_SHAPE))}>{Locale.label("mobile.votd.download")}</Button>
      </Stack>
    );
  };

  const openOnKey = (entry: DayEntry) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setSelected(entry);
    }
  };

  const togglePast = () => {
    if (past) { setPast(null); return; }
    const dates = pastDatesThisYear();
    setPast(dates.map((date) => ({ date, verse: null })));
    Promise.all(dates.map((d) => loadDailyVerse(d).catch((): DailyVerse | null => null))).then((verses) => {
      setPast((current) => (current ? dates.map((date, i) => ({ date, verse: verses[i] })) : current));
    });
  };

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
              {shareActions(today, verse)}
            </Grid>
          </Grid>

          <Box sx={{ mt: 5, mb: 2, display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 2 }}>
            <Typography component="h2" variant="h5">{Locale.label("pageSlug.thisWeek", "This week")}</Typography>
            <Link component="button" type="button" onClick={togglePast} aria-expanded={!!past} sx={{ fontSize: 16 }}>{Locale.label("mobile.votd.pastVerses")}</Link>
          </Box>
          <Box
            ref={setStrip}
            data-testid="votd-week-strip"
            sx={{ display: "flex", gap: 2, overflowX: "auto", scrollSnapType: "x mandatory", pb: 1, "&::-webkit-scrollbar": { display: "none" }, scrollbarWidth: "none" }}
          >
            {week.map((entry) => {
              const { date, verse: v } = entry;
              return (
                <Box key={date.toDateString()} data-testid="votd-week-day" role="button" tabIndex={0} onClick={() => setSelected(entry)} onKeyDown={openOnKey(entry)} sx={{ cursor: "pointer", "&:hover, &:focus-visible": { boxShadow: 3 }, flex: "0 0 280px", scrollSnapAlign: "start", border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden", bgcolor: "background.paper" }}>
                  <img src={imageUrl(date, "16x9")} alt={v ? `${v.reference} — ${title}` : title} loading="lazy" style={{ display: "block", width: "100%", aspectRatio: "16 / 9", objectFit: "cover" }} />
                  <Box sx={{ p: 2 }}>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>{date.toLocaleDateString(DateHelper.locale, { weekday: "short", month: "short", day: "numeric" })}</Typography>
                    <Typography sx={{ fontWeight: 600 }}>{v?.reference}</Typography>
                    <Typography variant="body2" sx={{ fontStyle: "italic", mt: 0.5 }}>{v?.text}</Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>

          {past && (
            <Box data-testid="votd-past" sx={{ mt: 4 }}>
              {groupByMonth(past).map((group) => (
                <Box key={group.key} component="section" sx={{ mb: 3 }}>
                  <Typography component="h3" variant="h6" sx={{ mb: 1 }}>{group.month.toLocaleDateString(DateHelper.locale, { month: "long" })}</Typography>
                  <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
                    {group.entries.map((entry) => (
                      <Box
                        key={entry.date.toDateString()}
                        data-testid="votd-past-row"
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelected(entry)}
                        onKeyDown={openOnKey(entry)}
                        sx={{ display: "flex", gap: 2, px: 2, py: 1.25, cursor: "pointer", "&:not(:last-of-type)": { borderBottom: 1, borderColor: "divider" }, "&:hover, &:focus-visible": { bgcolor: "action.hover" } }}
                      >
                        <Typography sx={{ color: "text.secondary", minWidth: 110 }}>{shortDate(entry.date)}</Typography>
                        <Typography sx={{ fontWeight: 600 }}>{entry.verse?.reference}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </>
      )}

      <Dialog open={!!selected} onClose={() => setSelected(null)} fullWidth maxWidth="md" aria-labelledby="votd-day-title" slotProps={{ paper: { "data-testid": "votd-day-dialog" } as any }}>
        {selected && (
          <>
            <DialogContent>
              <Box sx={{ borderRadius: 2, overflow: "hidden", bgcolor: "grey.900", display: "flex", justifyContent: "center", mb: 2 }}>
                <img src={imageUrl(selected.date, SHARE_SHAPE)} alt={selected.verse ? `${selected.verse.reference} — ${title}` : title} style={{ display: "block", width: "100%", aspectRatio: "16 / 9", objectFit: "contain" }} />
              </Box>
              <Typography id="votd-day-title" sx={{ color: "text.secondary" }}>{longDate(selected.date)}</Typography>
              {selected.verse && (
                <>
                  <Typography sx={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontSize: 22, lineHeight: 1.4, mt: 1 }}>&ldquo;{selected.verse.text}&rdquo;</Typography>
                  <Typography sx={{ mt: 1, fontWeight: 600 }}>{selected.verse.reference}</Typography>
                </>
              )}
              {shareActions(selected.date, selected.verse)}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelected(null)}>{Locale.label("common.close")}</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      <Snackbar open={!!message} autoHideDuration={2500} onClose={() => setMessage(null)} message={message} />
    </Container>
  );
}
