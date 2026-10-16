"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Box, Button, Icon, Menu, MenuItem, Snackbar, Typography } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { ApiHelper, CommonEnvironmentHelper, Locale } from "@churchapps/apphelper";
import { EventHelper } from "@churchapps/helpers";
import type { ElementInterface } from "@/helpers";
import { buildOccurrences, eventPageId, firstLine, timeRange, type Occurrence } from "@/helpers/EventOccurrences";

interface Props { element: ElementInterface; churchId: string; }

const MAX_TILES = 12;

const whenLine = (o: Occurrence) => {
  const weekday = o.start.toLocaleDateString(undefined, { weekday: "long" });
  if (o.event.allDay) return weekday + ", " + o.start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return weekday + ", " + timeRange(o.start, o.end);
};

export const UpcomingEventsElement = ({ element, churchId }: Props) => {
  const calendarType = element.answers?.calendarType;
  const calendarId = element.answers?.calendarId as string | undefined;
  const [items, setItems] = useState<Occurrence[] | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!calendarId) return;
    const path = calendarType === "group" ? "/events/public/group/" + churchId + "/" + calendarId : "/curatedEvents/public/calendar/" + churchId + "/" + calendarId;
    Promise.all([ApiHelper.getAnonymous(path, "ContentApi"), EventHelper.ensureInitialized()]).then(([events]) => {
      const now = new Date();
      const windowEnd = new Date(now);
      windowEnd.setFullYear(windowEnd.getFullYear() + 1);
      const occurrences = buildOccurrences(Array.isArray(events) ? events : [], now, windowEnd, 1);
      occurrences.sort((a, b) => a.start.getTime() - b.start.getTime());
      setItems(occurrences.slice(0, MAX_TILES));
    }).catch(() => setItems([]));
  }, [calendarType, calendarId, churchId]);

  const icsUrl = CommonEnvironmentHelper.ContentApi + "/events/subscribe?" + (calendarType === "group" ? "groupId" : "curatedCalendarId") + "=" + calendarId + "&churchId=" + churchId;

  const copyLink = () => { navigator.clipboard.writeText(icsUrl); setCopied(true); setAnchorEl(null); };
  const downloadIcs = () => {
    const link = document.createElement("a");
    link.href = icsUrl;
    link.download = "calendar.ics";
    link.click();
    setAnchorEl(null);
  };

  if (!calendarId) return <div style={{ textAlign: "center", padding: 20 }}><p>No calendar selected. Please configure this element.</p></div>;

  return (
    <div id={"el-" + element.id}>
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<Icon>link</Icon>} endIcon={<ArrowDropDownIcon />} size="small" variant="contained" onClick={(e) => setAnchorEl(e.currentTarget)} data-testid="calendar-subscribe-button">{Locale.label("eventPage.subscribe")}</Button>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
          <MenuItem onClick={copyLink}><Icon sx={{ mr: 1 }}>content_copy</Icon>{Locale.label("eventPage.copyIcsLink")}</MenuItem>
          <MenuItem onClick={downloadIcs}><Icon sx={{ mr: 1 }}>download</Icon>{Locale.label("eventPage.downloadIcs")}</MenuItem>
        </Menu>
      </Box>
      {items && items.length === 0 && <Typography sx={{ textAlign: "center", color: "text.secondary", py: 4 }}>{Locale.label("eventPage.noUpcoming")}</Typography>}
      <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" } }}>
        {(items || []).map((o) => {
          const photo = (o.event as any).photoUrl as string | undefined;
          return (
            <Box key={eventPageId(o.event) + o.start.toISOString()} component={Link} href={"/events/" + eventPageId(o.event)} data-testid="upcoming-event-tile" data-start={o.start.toISOString()}
              sx={{ display: "block", textDecoration: "none", color: "inherit", border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden", bgcolor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.06)", "&:hover": { boxShadow: 4 } }}>
              <Box sx={{ position: "relative", height: 190, backgroundImage: photo ? "url(" + photo + ")" : undefined, backgroundSize: "cover", backgroundPosition: "center", bgcolor: photo ? undefined : "var(--dark, #1B4965)", display: "flex", alignItems: "center", justifyContent: "center", px: 3 }}>
                <Box sx={{ position: "absolute", left: 14, top: 14, bgcolor: "#fff", borderRadius: 2, px: 1.25, py: 0.75, textAlign: "center", lineHeight: 1.05, boxShadow: "0 1px 3px rgba(0,0,0,.2)" }}>
                  <Typography component="span" sx={{ display: "block", fontSize: 11, letterSpacing: ".08em", fontWeight: 700, color: "primary.main", textTransform: "uppercase" }}>{o.start.toLocaleDateString(undefined, { month: "short" })}</Typography>
                  <Typography component="span" sx={{ display: "block", fontSize: 20, fontWeight: 700, color: "text.primary" }}>{o.start.getDate()}</Typography>
                </Box>
                {!photo && <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 22, textAlign: "center", fontFamily: "var(--headingFont, inherit)" }}>{o.event.title}</Typography>}
              </Box>
              <Box sx={{ px: 2.25, pt: 2, pb: 2.25 }}>
                <Typography component="h3" sx={{ m: 0, mb: 0.75, fontSize: 18, fontWeight: 700, color: "text.primary" }}>{o.event.title}</Typography>
                <Typography sx={{ color: "primary.main", fontWeight: 500, fontSize: 15, mb: 1 }}>{whenLine(o)}</Typography>
                <Typography sx={{ color: "text.secondary", fontSize: 15, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{firstLine(o.event.description)}</Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
      <Snackbar open={copied} onClose={() => setCopied(false)} autoHideDuration={2000} message={Locale.label("eventPage.copied")} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} />
    </div>
  );
};
