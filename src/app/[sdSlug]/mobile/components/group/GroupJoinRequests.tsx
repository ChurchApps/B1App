"use client";

import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { GroupJoinRequestInterface } from "@churchapps/helpers";
import { mobileTheme } from "../mobileTheme";
import { PersonAvatar, Row, RowList } from "../kit";

const tc = mobileTheme.colors;

interface Props {
  groupId: string;
  onApproved: () => void;
}

// Pending join requests for a group leader to approve or decline. Renders nothing when there are none.
export const GroupJoinRequests = ({ groupId, onApproved }: Props) => {
  const queryClient = useQueryClient();
  const queryKey = ["group-join-requests", groupId];
  const [busyId, setBusyId] = React.useState("");
  const [failed, setFailed] = React.useState(false);

  const { data: requests = [] } = useQuery<GroupJoinRequestInterface[]>({
    queryKey,
    queryFn: async () => {
      const data = await ApiHelper.get(`/groupjoinrequests/group/${groupId}`, "MembershipApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: !!groupId
  });

  const decide = async (r: GroupJoinRequestInterface, action: "approve" | "decline") => {
    if (!r.id) return;
    setBusyId(r.id);
    setFailed(false);
    try {
      await ApiHelper.post(`/groupjoinrequests/${r.id}/${action}`, {}, "MembershipApi");
      queryClient.setQueryData<GroupJoinRequestInterface[]>(queryKey, (prev) => (prev || []).filter((x) => x.id !== r.id));
      if (action === "approve") onApproved();
    } catch {
      setFailed(true);
      queryClient.invalidateQueries({ queryKey });
    } finally {
      setBusyId("");
    }
  };

  if (requests.length === 0) return null;

  return (
    <Box data-testid="group-join-requests" sx={{ mb: "16px", pb: "8px", borderBottom: `1px solid ${tc.border}` }}>
      <Typography component="h3" sx={{ fontSize: 14, lineHeight: "20px", fontWeight: 600, color: tc.text, m: 0 }}>
        {Locale.label("mobile.group.joinRequests")} · {requests.length}
      </Typography>
      <RowList>
        {requests.map((r) => {
          const name = r.person?.name?.display || Locale.label("mobile.components.unknown");
          return (
            <Box key={r.id} data-testid={`join-request-${r.id}`}>
              <Row leading={<PersonAvatar person={r.person} name={name} />} title={name} subtitle={r.message || undefined} />
              <Box sx={{ display: "flex", gap: "8px", pb: "8px" }}>
                <Button size="small" variant="contained" disabled={!!busyId} onClick={() => decide(r, "approve")} data-testid={`approve-request-${r.id}`}>
                  {Locale.label("mobile.group.approve")}
                </Button>
                <Button size="small" variant="outlined" disabled={!!busyId} onClick={() => decide(r, "decline")} data-testid={`decline-request-${r.id}`}>
                  {Locale.label("mobile.details.decline")}
                </Button>
              </Box>
            </Box>
          );
        })}
      </RowList>
      {failed && <Typography role="alert" sx={{ color: tc.error, fontSize: 14, mt: "6px" }}>{Locale.label("mobile.group.joinRequestFailed")}</Typography>}
    </Box>
  );
};
