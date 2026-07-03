"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Icon, IconButton, Skeleton, Typography } from "@mui/material";
import { ApiHelper, DateHelper, Locale } from "@churchapps/apphelper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { navigateBack } from "../util";

interface Props {
  config: ConfigurationInterface;
}

interface Booking { id?: string; roomId?: string; resourceId?: string; status?: string }
interface RequestRow {
  id?: string;
  title?: string;
  start?: string | Date;
  allDay?: boolean;
  approvalStatus?: string;
  bookings?: Booking[];
}

export const MyRequestsPage = ({ config: _config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [cancelId, setCancelId] = React.useState<string | null>(null);

  const { data: requests = null } = useQuery<RequestRow[]>({
    queryKey: ["event-requests-mine"],
    queryFn: async () => {
      const data = await ApiHelper.get("/events/requests/mine", "ContentApi");
      return Array.isArray(data) ? data : [];
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true
  });

  const { data: rooms = [] } = useQuery<{ id?: string; name?: string }[]>({
    queryKey: ["rooms-lookup"],
    queryFn: async () => {
      const data = await ApiHelper.get("/rooms", "ContentApi");
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60 * 1000
  });

  const { data: resources = [] } = useQuery<{ id?: string; name?: string }[]>({
    queryKey: ["resources-lookup"],
    queryFn: async () => {
      const data = await ApiHelper.get("/resources", "ContentApi");
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60 * 1000
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: ["event-requests-mine"] });

  const handleCancel = async () => {
    if (!cancelId) return;
    try {
      await ApiHelper.delete("/events/" + cancelId, "ContentApi");
    } finally {
      setCancelId(null);
      refetch();
    }
  };

  const statusColor = (status?: string) => {
    switch (status) {
      case "approved": return tc.success;
      case "rejected": return tc.error;
      case "pending":
      default: return tc.warning;
    }
  };

  const statusLabel = (status?: string) => {
    switch (status) {
      case "approved": return Locale.label("mobile.requests.statusApproved");
      case "rejected": return Locale.label("mobile.requests.statusRejected");
      case "pending":
      default: return Locale.label("mobile.requests.statusPending");
    }
  };

  const bookingName = (b: Booking) => {
    if (b.roomId) return rooms.find((r) => r.id === b.roomId)?.name || Locale.label("mobile.group.rooms");
    if (b.resourceId) return resources.find((r) => r.id === b.resourceId)?.name || Locale.label("mobile.group.resources");
    return "";
  };

  const renderBack = () => (
    <IconButton
      aria-label={Locale.label("mobile.components.back")}
      onClick={() => navigateBack(router, "/mobile/me")}
      sx={{ width: 40, height: 40, bgcolor: tc.surface, color: tc.text, boxShadow: mobileTheme.shadows.sm, mb: `${mobileTheme.spacing.md}px`, "&:hover": { bgcolor: tc.surface } }}
    >
      <Icon>arrow_back</Icon>
    </IconButton>
  );

  const renderSkeleton = (i: number) => (
    <Box key={`sk-${i}`} sx={{ bgcolor: tc.surface, borderRadius: `${mobileTheme.radius.lg}px`, boxShadow: mobileTheme.shadows.sm, p: `${mobileTheme.spacing.md}px` }}>
      <Skeleton variant="text" width="60%" height={22} />
      <Skeleton variant="text" width="40%" height={14} />
    </Box>
  );

  const renderEmpty = () => (
    <Box sx={{ bgcolor: tc.surface, borderRadius: `${mobileTheme.radius.xl}px`, boxShadow: mobileTheme.shadows.sm, p: `${mobileTheme.spacing.lg}px`, textAlign: "center" }}>
      <Box sx={{ width: 64, height: 64, borderRadius: "32px", bgcolor: tc.iconBackground, display: "inline-flex", alignItems: "center", justifyContent: "center", mb: `${mobileTheme.spacing.md}px` }}>
        <Icon sx={{ fontSize: 32, color: tc.primary }}>event_note</Icon>
      </Box>
      <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: 0.5 }}>{Locale.label("mobile.requests.emptyTitle")}</Typography>
      <Typography sx={{ fontSize: 14, color: tc.textMuted }}>{Locale.label("mobile.requests.emptyBody")}</Typography>
    </Box>
  );

  const renderCard = (req: RequestRow) => (
    <Box key={req.id} sx={{ bgcolor: tc.surface, borderRadius: `${mobileTheme.radius.lg}px`, boxShadow: mobileTheme.shadows.sm, p: `${mobileTheme.spacing.md}px` }} data-testid={`request-card-${req.id}`}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: tc.text, mb: 0.25 }}>{req.title || Locale.label("mobile.group.event")}</Typography>
          {req.start && (
            <Typography sx={{ fontSize: 13, color: tc.textSecondary, display: "flex", alignItems: "center", gap: 0.5 }}>
              <Icon sx={{ fontSize: 14 }}>schedule</Icon>
              {DateHelper.prettyDateTime(new Date(req.start))}
            </Typography>
          )}
        </Box>
        <Box sx={{ px: 1, py: 0.25, borderRadius: "999px", bgcolor: `${statusColor(req.approvalStatus)}1A`, color: statusColor(req.approvalStatus), fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }} data-testid={`request-status-${req.id}`}>
          {statusLabel(req.approvalStatus)}
        </Box>
      </Box>

      {(req.bookings || []).length > 0 && (
        <Box sx={{ mt: 1 }}>
          {(req.bookings || []).map((b, i) => (
            <Box key={b.id || i} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 0.25 }}>
              <Typography sx={{ fontSize: 13, color: tc.textSecondary }}>{bookingName(b)}</Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: statusColor(b.status) }}>{statusLabel(b.status)}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {req.approvalStatus === "pending" && (
        <Box sx={{ mt: 1.5, display: "flex", justifyContent: "flex-end" }}>
          <Button size="small" onClick={() => setCancelId(req.id || null)} startIcon={<Icon>cancel</Icon>} data-testid={`request-cancel-${req.id}`} sx={{ color: tc.error, textTransform: "none", fontWeight: 500 }}>
            {Locale.label("mobile.requests.cancelRequest")}
          </Button>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      {renderBack()}
      <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
        {requests === null && [0, 1].map(renderSkeleton)}
        {requests !== null && requests.length === 0 && renderEmpty()}
        {requests !== null && requests.length > 0 && requests.map(renderCard)}
      </Box>

      <Dialog open={!!cancelId} onClose={() => setCancelId(null)}>
        <DialogTitle>{Locale.label("mobile.requests.cancelRequest")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{Locale.label("mobile.requests.cancelConfirm")}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelId(null)}>{Locale.label("mobile.requests.keep")}</Button>
          <Button onClick={handleCancel} variant="contained" data-testid="request-cancel-confirm" sx={{ bgcolor: tc.error, color: tc.onPrimary, textTransform: "none", "&:hover": { bgcolor: tc.error } }}>
            {Locale.label("mobile.requests.cancelRequest")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyRequestsPage;
