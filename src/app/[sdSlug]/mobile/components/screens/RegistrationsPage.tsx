"use client";

import React, { useContext, useState } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Icon, Skeleton, Typography } from "@mui/material";
import { ApiHelper, DateHelper, UserHelper } from "@churchapps/apphelper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { RegistrationInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";

interface Props {
  config: ConfigurationInterface;
}

export const RegistrationsPage = ({ config: _config }: Props) => {
  const tc = mobileTheme.colors;
  const context = useContext(UserContext);
  const personId = context?.person?.id || context?.userChurch?.person?.id || UserHelper.currentUserChurch?.person?.id;
  const queryClient = useQueryClient();
  const [cancelId, setCancelId] = useState<string | null>(null);

  const { data: registrations = null } = useQuery<RegistrationInterface[]>({
    queryKey: ["registrations", personId],
    queryFn: async () => {
      const data = await ApiHelper.get("/registrations/person/" + personId, "ContentApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: !!personId,
  });

  const handleCancel = async () => {
    if (!cancelId) return;
    await ApiHelper.post("/registrations/" + cancelId + "/cancel", {}, "ContentApi");
    setCancelId(null);
    queryClient.invalidateQueries({ queryKey: ["registrations", personId] });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "confirmed": return tc.success;
      case "pending": return tc.warning;
      case "cancelled": return tc.error;
      default: return tc.textSecondary;
    }
  };

  const renderSkeleton = (i: number) => (
    <Box
      key={`sk-${i}`}
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.lg}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.md}px`,
      }}
    >
      <Skeleton variant="text" width="60%" height={22} />
      <Skeleton variant="text" width="40%" height={14} />
      <Skeleton variant="rounded" width={100} height={32} sx={{ mt: 1 }} />
    </Box>
  );

  const renderEmpty = () => (
    <Box
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.xl}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.lg}px`,
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: "32px",
          bgcolor: tc.iconBackground,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          mb: `${mobileTheme.spacing.md}px`,
        }}
      >
        <Icon sx={{ fontSize: 32, color: tc.primary }}>event_available</Icon>
      </Box>
      <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: 0.5 }}>
        No registrations yet
      </Typography>
      <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
        You haven&apos;t registered for any events. Check back soon for upcoming events.
      </Typography>
    </Box>
  );

  const renderCard = (reg: RegistrationInterface) => {
    const isCancelled = reg.status === "cancelled";
    const statusColor = getStatusColor(reg.status);
    const eventStart = (reg as any).event?.start;
    const eventTitle = (reg as any).event?.title || "Event";

    return (
      <Box
        key={reg.id}
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`,
          opacity: isCancelled ? 0.65 : 1,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: tc.text, mb: 0.25 }}>
              {eventTitle}
            </Typography>
            {eventStart && (
              <Typography sx={{ fontSize: 13, color: tc.textSecondary, display: "flex", alignItems: "center", gap: 0.5 }}>
                <Icon sx={{ fontSize: 14 }}>schedule</Icon>
                {DateHelper.prettyDateTime(new Date(eventStart))}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              px: 1,
              py: 0.25,
              borderRadius: "999px",
              bgcolor: `${statusColor}1A`,
              color: statusColor,
              fontSize: 11,
              fontWeight: 600,
              textTransform: "capitalize",
              whiteSpace: "nowrap",
            }}
          >
            {reg.status || "registered"}
          </Box>
        </Box>

        {reg.members && reg.members.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: tc.text, mb: 0.25 }}>
              Registered Members:
            </Typography>
            {reg.members.map((m: any, i: number) => (
              <Typography key={i} sx={{ fontSize: 13, color: tc.textSecondary }}>
                {m.firstName} {m.lastName}
              </Typography>
            ))}
          </Box>
        )}

        {!isCancelled ? (
          <Box sx={{ mt: 1.5, display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button
              size="small"
              onClick={() => setCancelId(reg.id || null)}
              sx={{ color: tc.error, textTransform: "none", fontWeight: 500, borderRadius: `${mobileTheme.radius.md}px` }}
              startIcon={<Icon>cancel</Icon>}
            >
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              disabled
              sx={{
                bgcolor: tc.success,
                color: tc.onPrimary,
                textTransform: "none",
                fontWeight: 500,
                borderRadius: `${mobileTheme.radius.md}px`,
                "&.Mui-disabled": { bgcolor: `${tc.success}B3`, color: tc.onPrimary },
              }}
            >
              Registered
            </Button>
          </Box>
        ) : null}
      </Box>
    );
  };

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      <Typography sx={{ fontSize: 24, fontWeight: 700, color: tc.text, mb: `${mobileTheme.spacing.md}px` }}>
        My Registrations
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
        {registrations === null && [0, 1].map(renderSkeleton)}
        {registrations !== null && registrations.length === 0 && renderEmpty()}
        {registrations !== null && registrations.length > 0 && registrations.map(renderCard)}
      </Box>

      <Dialog open={!!cancelId} onClose={() => setCancelId(null)}>
        <DialogTitle>Cancel Registration?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this registration? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelId(null)}>Keep</Button>
          <Button
            onClick={handleCancel}
            variant="contained"
            sx={{ bgcolor: tc.error, color: tc.onPrimary, textTransform: "none", "&:hover": { bgcolor: tc.error } }}
          >
            Cancel Registration
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
