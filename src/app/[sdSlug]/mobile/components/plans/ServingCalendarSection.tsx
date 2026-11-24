"use client";

import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { mobileTheme } from "../mobileTheme";
import { PlateSection, TextLink } from "../kit";

interface FeedLink { churchId: string; personId: string; token: string }

const feedUrl = (feed: FeedLink) => {
  const doingApi = EnvironmentHelper.Common?.DoingApi || "";
  return `${doingApi}/assignments/public/calendar?churchId=${encodeURIComponent(feed.churchId)}&personId=${encodeURIComponent(feed.personId)}&token=${encodeURIComponent(feed.token)}`;
};

const openFeed = (feed: FeedLink) => {
  const httpsUrl = feedUrl(feed);
  try {
    window.location.href = httpsUrl.replace(/^https?:\/\//, "webcal://");
  } catch {
    window.open(httpsUrl, "_blank", "noopener,noreferrer");
  }
};

// The member's accepted serving times as a calendar subscription; Reset link replaces the secret.
export const ServingCalendarSection = () => {
  const tc = mobileTheme.colors;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const subscribe = async () => {
    if (busy || !EnvironmentHelper.Common?.DoingApi) return;
    setMessage("");
    const feed: FeedLink | null = await ApiHelper.get("/assignments/my/calendar", "DoingApi").catch((): null => null);
    if (feed?.token) openFeed(feed);
    else setMessage(Locale.label("mobile.serving.calendarError"));
  };

  const reset = async () => {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const feed: FeedLink | null = await ApiHelper.post("/assignments/my/calendar/reset", {}, "DoingApi");
      setMessage(feed?.token ? Locale.label("mobile.serving.calendarResetDone") : Locale.label("mobile.serving.calendarError"));
    } catch {
      setMessage(Locale.label("mobile.serving.calendarError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PlateSection title={Locale.label("mobile.serving.calendarTitle")} data-testid="plans-serving-calendar">
      <Box sx={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <TextLink data-testid="plans-calendar-subscribe" onClick={subscribe}>{Locale.label("mobile.group.subscribe")}</TextLink>
        <TextLink data-testid="plans-calendar-reset" onClick={reset} disabled={busy}>{Locale.label("mobile.serving.calendarReset")}</TextLink>
      </Box>
      <Typography sx={{ fontSize: 13.5, lineHeight: "19px", color: tc.textSecondary, mt: "4px" }}>{Locale.label("mobile.serving.calendarHint")}</Typography>
      {message && <Typography role="status" sx={{ fontSize: 13.5, lineHeight: "19px", color: tc.textSecondary, mt: "8px" }}>{message}</Typography>}
    </PlateSection>
  );
};
