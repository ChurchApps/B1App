"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Skeleton, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { ApiHelper, DateHelper, Locale } from "@churchapps/apphelper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { LoadErrorAlert } from "../LoadErrorAlert";
import { BackVerb, PageHead, Plate, PlateSection, QuietEmpty, Row, StatusBadge, TextLink, useSliceView, type BadgeTone } from "../kit";

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

const tc = mobileTheme.colors;

const statusTone = (status?: string): BadgeTone => (status === "approved" ? "ok" : status === "rejected" ? "bad" : "warn");

const statusLabel = (status?: string) => {
  switch (status) {
    case "approved": return Locale.label("mobile.requests.statusApproved");
    case "rejected": return Locale.label("mobile.requests.statusRejected");
    case "pending":
    default: return Locale.label("mobile.requests.statusPending");
  }
};

const MyRequestsPageInner = (_props: Props) => {
  const queryClient = useQueryClient();
  const [view] = useSliceView();
  const [cancelId, setCancelId] = React.useState<string | null>(null);
  const [cancelError, setCancelError] = React.useState("");

  const { data: requests = null, isError: requestsError, refetch: refetchRequests } = useQuery<RequestRow[]>({
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
    setCancelError("");
    try {
      await ApiHelper.delete("/events/" + cancelId, "ContentApi");
      setCancelId(null);
      refetch();
    } catch {
      setCancelError(Locale.label("mobile.screens.unableToSaveChanges"));
    }
  };

  const bookingName = (b: Booking) => {
    if (b.roomId) return rooms.find((r) => r.id === b.roomId)?.name || Locale.label("mobile.group.rooms");
    if (b.resourceId) return resources.find((r) => r.id === b.resourceId)?.name || Locale.label("mobile.group.resources");
    return "";
  };

  const renderItem = (req: RequestRow) => (
    <Box key={req.id} className="req-item" sx={{ py: "6px" }} data-testid={`request-card-${req.id}`}>
      <Row
        title={req.title || Locale.label("mobile.group.event")}
        subtitle={req.start ? DateHelper.prettyDateTime(new Date(req.start)) : undefined}
        trailing={<span data-testid={`request-status-${req.id}`}><StatusBadge tone={statusTone(req.approvalStatus)} dot={req.approvalStatus === "approved"}>{statusLabel(req.approvalStatus)}</StatusBadge></span>}
      />
      {((req.bookings || []).length > 0 || req.approvalStatus === "pending") && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "6px", pb: "10px" }}>
          {(req.bookings || []).length > 0 && (
            <Typography sx={{ fontSize: 13.5, color: tc.textSecondary }}>
              {(req.bookings || []).map((b) => `${bookingName(b)} ${statusLabel(b.status).toLowerCase()}`).join(" · ")}
            </Typography>
          )}
          {req.approvalStatus === "pending" && (
            <Box><TextLink danger onClick={() => setCancelId(req.id || null)} data-testid={`request-cancel-${req.id}`}>{Locale.label("mobile.requests.cancelRequest")}</TextLink></Box>
          )}
        </Box>
      )}
    </Box>
  );

  const list = (items: RequestRow[]) => (
    <Box sx={{ "& > .req-item + .req-item": { borderTop: `1px solid ${tc.border}` } }}>{items.map(renderItem)}</Box>
  );

  const now = Date.now();
  const isPast = (r: RequestRow) => !!r.start && new Date(r.start).getTime() < now;
  const upcoming = requests ? requests.filter((r) => !isPast(r)) : null;
  const past = requests ? requests.filter(isPast) : [];

  const cancelDialog = (
    <Dialog open={!!cancelId} onClose={() => { setCancelId(null); setCancelError(""); }}>
      <DialogTitle>{Locale.label("mobile.requests.cancelRequest")}</DialogTitle>
      <DialogContent>
        {cancelError && <Alert severity="error" sx={{ mb: 2 }}>{cancelError}</Alert>}
        <DialogContentText>{Locale.label("mobile.requests.cancelConfirm")}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={() => { setCancelId(null); setCancelError(""); }}>{Locale.label("mobile.requests.keep")}</Button>
        <Button onClick={handleCancel} variant="contained" color="error" data-testid="request-cancel-confirm">
          {Locale.label("mobile.requests.cancelRequest")}
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (view === "past") {
    return (
      <Box>
        <BackVerb label={Locale.label("mobile.requests.backToRequests")} href="/mobile/myRequests" />
        <PageHead title={Locale.label("mobile.screens.tabPast")} />
        <Plate>
          <PlateSection>{past.length === 0 ? <QuietEmpty>{Locale.label("mobile.requests.noPast")}</QuietEmpty> : list(past)}</PlateSection>
        </Plate>
        {cancelDialog}
      </Box>
    );
  }

  return (
    <Box>
      <PageHead title={Locale.label("mobile.requests.myRequests")} lede={Locale.label("mobile.requests.lede")}>
        <Button variant="contained" component={Link} href="/mobile/requestEvent" startIcon={<AddIcon />}>{Locale.label("mobile.requests.title")}</Button>
      </PageHead>
      {requests === null && requestsError && <Box sx={{ mx: { xs: "12px", md: 0 }, mb: "12px" }}><LoadErrorAlert onRetry={() => refetchRequests()} /></Box>}
      <Plate>
        <PlateSection title={Locale.label("mobile.screens.tabUpcoming")}>
          {upcoming === null && !requestsError && [0, 1].map((i) => (
            <Box key={i} sx={{ py: "8px" }}>
              <Skeleton variant="text" width="60%" height={22} />
              <Skeleton variant="text" width="40%" height={16} />
            </Box>
          ))}
          {upcoming !== null && upcoming.length === 0 && (
            <QuietEmpty>{requests?.length ? Locale.label("mobile.requests.noUpcoming") : Locale.label("mobile.requests.emptyBody")}</QuietEmpty>
          )}
          {upcoming !== null && upcoming.length > 0 && list(upcoming)}
        </PlateSection>
        {past.length > 0 && (
          <PlateSection
            title={Locale.label("mobile.screens.tabPast")}
            action={past.length > 3 && <TextLink href="/mobile/myRequests?view=past">{Locale.label("mobile.requests.allPast")}</TextLink>}
          >
            {list(past.slice(0, 3))}
          </PlateSection>
        )}
      </Plate>
      {cancelDialog}
    </Box>
  );
};

export const MyRequestsPage = (props: Props) => (
  <Suspense>
    <MyRequestsPageInner {...props} />
  </Suspense>
);

export default MyRequestsPage;
