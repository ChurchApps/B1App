"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Box, Button, Container, Typography } from "@mui/material";
import { MarkdownPreviewLight } from "@churchapps/apphelper/markdown";
import { EventHelper } from "@churchapps/helpers";
import type { EventInterface } from "@churchapps/helpers";
import { buildOccurrences, timeRange } from "@/helpers/EventOccurrences";

export interface EventPageLabels { allEvents: string; when: string; where: string; register: string; addToCalendar: string; }

// Labels come from the server page: the client Locale loads asynchronously and would flash raw keys.
interface Props { event: EventInterface & { roomNames?: string[]; photoUrl?: string }; icsUrl: string; labels: EventPageLabels; }

const longDate = (d: Date) => d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });

export const EventPageContent = ({ event, icsUrl, labels }: Props) => {
  const [when, setWhen] = useState({ start: new Date(event.start || ""), end: new Date(event.end || event.start || "") });
  const [ruleText, setRuleText] = useState("");

  useEffect(() => {
    EventHelper.ensureInitialized().then(() => {
      const now = new Date();
      const windowEnd = new Date(now);
      windowEnd.setFullYear(windowEnd.getFullYear() + 1);
      const next = buildOccurrences([event], now, windowEnd, 1)[0];
      if (next) setWhen({ start: next.start, end: next.end });
      if (event.recurrenceRule) {
        try {
          const text = EventHelper.getFullRRule(event).toText();
          setRuleText(text.charAt(0).toUpperCase() + text.slice(1));
        } catch { setRuleText(""); }
      }
    });
  }, [event]);

  const times = event.allDay ? "" : timeRange(when.start, when.end);
  const dateLine = [longDate(when.start), times].filter(Boolean).join(" · ");
  const whenText = ruleText ? [ruleText, times].filter(Boolean).join(", ") : dateLine;
  const rooms = (event.roomNames || []).join(", ");

  const goBack = (e: React.MouseEvent) => {
    if (window.history.length > 1) { e.preventDefault(); window.history.back(); }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Link href="/" onClick={goBack} data-testid="event-back-link" style={{ display: "inline-block", color: "var(--accent, #2A6F97)", textDecoration: "none", marginBottom: 14 }}>← {labels.allEvents}</Link>
      {event.photoUrl && <Box component="img" src={event.photoUrl} alt={event.title || ""} data-testid="event-photo" sx={{ width: "100%", height: { xs: 200, md: 360 }, objectFit: "cover", borderRadius: 3, display: "block" }} />}
      <Box sx={{ display: "grid", gap: { xs: 3, md: 6 }, gridTemplateColumns: { xs: "1fr", md: "1fr 320px" }, pt: 3.5, pb: 6 }}>
        <Box>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, fontSize: { xs: "1.75rem", md: "2.125rem" }, mb: 1 }}>{event.title}</Typography>
          <Typography sx={{ color: "primary.main", fontWeight: 500, fontSize: 18, mb: 2.5 }} data-testid="event-date-line">{dateLine}</Typography>
          <Box sx={{ lineHeight: 1.55, "& p": { mt: 0, mb: 1.75 }, "& ul, & ol": { mt: 0, mb: 1.75, pl: 2.75 } }}>
            <MarkdownPreviewLight value={event.description || ""} />
          </Box>
        </Box>
        <Box component="aside" sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 2.75, height: "fit-content", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
          <Typography sx={{ display: "flex", gap: 1.25, fontSize: 15, mb: 1.5 }} data-testid="event-when"><b>{labels.when}</b><span>{whenText}</span></Typography>
          {rooms && <Typography sx={{ display: "flex", gap: 1.25, fontSize: 15, mb: 1.5 }} data-testid="event-where"><b>{labels.where}</b><span>{rooms}</span></Typography>}
          {event.registrationEnabled && <Button component={Link} href={"/register/" + event.id} variant="contained" fullWidth sx={{ mt: 1, mb: 1.25, py: 1.25 }} data-testid="event-register-button">{labels.register}</Button>}
          <Typography component="a" href={icsUrl} download={(event.title || "event") + ".ics"} data-testid="event-add-to-calendar" sx={{ display: "block", textAlign: "center", color: "var(--accent, #2A6F97)", fontSize: 15, mt: 1 }}>{labels.addToCalendar}</Typography>
        </Box>
      </Box>
    </Container>
  );
};
