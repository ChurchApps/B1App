"use client";

import React from "react";
import { Switch, Typography } from "@mui/material";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { mobileTheme } from "../mobileTheme";
import { Row } from "../kit";

const tc = mobileTheme.colors;

interface EntityMute { entityType?: string; entityId?: string; level?: string }

const MUTES_KEY = ["my-group-mutes"];

// One "Mute this group" switch per group. Saves through POST /reminders/mute: level "muted" silences
// the group's notifications and emails at the send gate; level "all" turns them back on.
export function GroupMuteSwitch({ groupId }: { groupId: string }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  const { data: mutes, isFetched } = useQuery<EntityMute[]>({
    queryKey: MUTES_KEY,
    queryFn: async () => {
      const data = await ApiHelper.get("/reminders/mute?entityType=group", "MessagingApi");
      return Array.isArray(data) ? data : [];
    }
  });

  const muted = (mutes || []).some((m) => m.entityType === "group" && m.entityId === groupId && m.level === "muted");

  const setMuted = async (next: boolean) => {
    const level = next ? "muted" : "all";
    const previous = mutes || [];
    setSaving(true);
    setFailed(false);
    queryClient.setQueryData<EntityMute[]>(MUTES_KEY, [...previous.filter((m) => !(m.entityType === "group" && m.entityId === groupId)), { entityType: "group", entityId: groupId, level }]);
    try {
      await ApiHelper.post("/reminders/mute", { entityType: "group", entityId: groupId, level }, "MessagingApi");
    } catch {
      queryClient.setQueryData<EntityMute[]>(MUTES_KEY, previous);
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  const label = Locale.label("mobile.group.muteGroup");
  return (
    <>
      <Row
        title={label}
        subtitle={Locale.label("mobile.group.muteGroupHelp")}
        trailing={<Switch checked={muted} disabled={!isFetched || saving} onChange={(e) => setMuted(e.target.checked)} slotProps={{ input: { "aria-label": label } }} data-testid="group-mute-switch" />}
        data-testid="group-mute-row"
      />
      {failed && <Typography role="alert" sx={{ fontSize: 13, color: tc.error }}>{Locale.label("mobile.group.muteGroupFailed")}</Typography>}
    </>
  );
}
