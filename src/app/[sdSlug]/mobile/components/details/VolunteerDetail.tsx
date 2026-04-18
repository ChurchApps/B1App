"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  CircularProgress,
  Icon,
  IconButton,
  Skeleton,
  Snackbar,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { ApiHelper, DateHelper, UserHelper } from "@churchapps/apphelper";
import type {
  AssignmentInterface,
  PlanInterface,
  PositionInterface,
  TimeInterface,
} from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import UserContext from "@/context/UserContext";
import { mobileTheme } from "../mobileTheme";

interface Props {
  id: string;
  config: ConfigurationInterface;
}

interface SignupPlanData {
  plan: PlanInterface;
  positions: (PositionInterface & { filledCount: number })[];
  times: TimeInterface[];
}

// TODO: Verify endpoints. Following VolunteerPage, we load the public signup list and
// filter to plan.id === id. If that payload doesn't include positions for this plan,
// fall back to /plans/{id} + /positions/plan/{id} + /assignments/plan/{id} on DoingApi.
// Signup POST: /assignments [{ positionId, personId, status:"Unconfirmed" }] on DoingApi.

export const VolunteerDetail = ({ id, config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const userContext = React.useContext(UserContext);

  const [plan, setPlan] = React.useState<PlanInterface | null>(null);
  const [positions, setPositions] = React.useState<
    (PositionInterface & { filledCount: number; neededCount?: number })[]
  >([]);
  const [assignments, setAssignments] = React.useState<AssignmentInterface[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [snack, setSnack] = React.useState<string | null>(null);
  const [signingUpId, setSigningUpId] = React.useState<string | null>(null);

  const personId =
    userContext?.person?.id || UserHelper.currentUserChurch?.person?.id || "";
  const signedIn = !!personId;

  const load = React.useCallback(async () => {
    const churchId = config?.church?.id;
    if (!churchId) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    setLoading(true);
    setNotFound(false);
    try {
      const data: SignupPlanData[] = await ApiHelper.getAnonymous(
        "/plans/public/signup/" + churchId,
        "DoingApi"
      );
      const match = Array.isArray(data) ? data.find((d) => d?.plan?.id === id) : null;
      if (match) {
        setPlan(match.plan);
        setPositions(match.positions || []);
        // If signed-in, try to load my existing assignments for this plan so we can
        // reflect "already signed up" state. Non-fatal if it fails.
        if (signedIn) {
          try {
            const planAssignments: AssignmentInterface[] = await ApiHelper.get(
              "/assignments/plan/" + match.plan.id,
              "DoingApi"
            );
            setAssignments(Array.isArray(planAssignments) ? planAssignments : []);
          } catch {
            setAssignments([]);
          }
        }
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [config?.church?.id, id, signedIn]);

  React.useEffect(() => {
    load();
  }, [load]);

  const isAssigned = (positionId?: string) => {
    if (!positionId || !personId) return false;
    return assignments.some((a) => a.positionId === positionId && a.personId === personId);
  };

  const handleVolunteer = async (position: PositionInterface & { filledCount: number }) => {
    if (!position.id) return;
    if (!signedIn) {
      setError("Please sign in to volunteer.");
      return;
    }
    setSigningUpId(position.id);
    try {
      await ApiHelper.post(
        "/assignments",
        [{ positionId: position.id, personId, status: "Unconfirmed" }],
        "DoingApi"
      );
      setSnack("You signed up!");
      // Optimistically update local state
      setAssignments((prev) => [
        ...prev,
        { positionId: position.id, personId, status: "Unconfirmed" } as AssignmentInterface,
      ]);
      setPositions((prev) =>
        prev.map((p) =>
          p.id === position.id ? { ...p, filledCount: (p.filledCount || 0) + 1 } : p
        )
      );
      // Refresh to reconcile with server
      load();
    } catch {
      setError("Unable to sign up. Please try again.");
    } finally {
      setSigningUpId(null);
    }
  };

  const serviceDateStr = plan?.serviceDate
    ? DateHelper.prettyDate(DateHelper.toDate(plan.serviceDate))
    : "";

  const openCount = positions.reduce(
    (sum, p) => sum + Math.max(0, (p.count || 0) - (p.filledCount || 0)),
    0
  );

  const renderHero = () => (
    <Box
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.lg}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.md}px`,
        mb: `${mobileTheme.spacing.md}px`,
      }}
    >
      <Typography sx={{ fontSize: 22, fontWeight: 700, color: tc.text }}>
        {plan?.name || ""}
      </Typography>
      {serviceDateStr && (
        <Typography sx={{ fontSize: 14, color: tc.textSecondary, mt: 0.25 }}>
          {serviceDateStr}
        </Typography>
      )}
      <Box
        sx={{
          mt: `${mobileTheme.spacing.sm}px`,
          display: "inline-flex",
          alignItems: "center",
          px: "10px",
          py: "3px",
          borderRadius: "999px",
          bgcolor: openCount > 0 ? `${tc.success}1A` : `${tc.textSecondary}1A`,
          color: openCount > 0 ? tc.success : tc.textSecondary,
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {openCount > 0 ? `${openCount} open position${openCount === 1 ? "" : "s"}` : "Full"}
      </Box>
    </Box>
  );

  const renderPosition = (
    p: PositionInterface & { filledCount: number; neededCount?: number }
  ) => {
    const needed = (p as any).count || 0;
    const filled = p.filledCount || 0;
    const mine = isAssigned(p.id);
    const isFull = needed > 0 && filled >= needed;
    const busy = signingUpId === p.id;

    return (
      <Box
        key={p.id}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: `${mobileTheme.spacing.md}px`,
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: tc.text }}>
            {p.name}
          </Typography>
          {p.categoryName && (
            <Typography sx={{ fontSize: 13, color: tc.textSecondary, mt: 0.25 }}>
              {p.categoryName}
            </Typography>
          )}
          <Typography sx={{ fontSize: 12, color: tc.textMuted, mt: 0.5 }}>
            {filled} / {needed} filled
          </Typography>
        </Box>
        <Button
          variant="contained"
          disabled={mine || isFull || busy}
          onClick={() => handleVolunteer(p)}
          sx={{
            bgcolor: tc.primary,
            color: tc.onPrimary,
            borderRadius: `${mobileTheme.radius.md}px`,
            textTransform: "none",
            fontWeight: 500,
            whiteSpace: "nowrap",
            "&:hover": { bgcolor: tc.primary },
            "&.Mui-disabled": {
              bgcolor: tc.border,
              color: tc.textSecondary,
            },
          }}
        >
          {busy ? (
            <CircularProgress size={16} sx={{ color: tc.onPrimary }} />
          ) : mine ? (
            "You signed up"
          ) : isFull ? (
            "Full"
          ) : (
            "Volunteer"
          )}
        </Button>
      </Box>
    );
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
      <Skeleton variant="text" width="60%" height={20} />
      <Skeleton variant="text" width="40%" height={14} />
      <Skeleton variant="rounded" width={110} height={32} sx={{ mt: 1.5, ml: "auto" }} />
    </Box>
  );

  const renderSignedOut = () => (
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
          width: 56,
          height: 56,
          borderRadius: "28px",
          bgcolor: tc.iconBackground,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          mb: `${mobileTheme.spacing.sm}px`,
        }}
      >
        <Icon sx={{ fontSize: 28, color: tc.primary }}>lock</Icon>
      </Box>
      <Typography sx={{ fontSize: 16, fontWeight: 600, color: tc.text, mb: 0.5 }}>
        Sign in to volunteer
      </Typography>
      <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
        You need an account to sign up for serving opportunities.
      </Typography>
    </Box>
  );

  const renderNotFound = () => (
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
          width: 56,
          height: 56,
          borderRadius: "28px",
          bgcolor: tc.iconBackground,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          mb: `${mobileTheme.spacing.sm}px`,
        }}
      >
        <Icon sx={{ fontSize: 28, color: tc.textSecondary }}>event_busy</Icon>
      </Box>
      <Typography sx={{ fontSize: 16, fontWeight: 600, color: tc.text, mb: 0.5 }}>
        Plan not found
      </Typography>
      <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
        This serving opportunity is no longer available.
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: `${mobileTheme.spacing.sm}px` }}>
        <IconButton
          aria-label="Back"
          onClick={() => router.back()}
          sx={{ color: tc.text }}
          size="small"
        >
          <ArrowBackIcon />
        </IconButton>
      </Box>

      {loading && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
          {[0, 1, 2].map(renderSkeleton)}
        </Box>
      )}

      {!loading && notFound && renderNotFound()}

      {!loading && !notFound && plan && (
        <>
          {renderHero()}
          {!signedIn && (
            <Box sx={{ mb: `${mobileTheme.spacing.md}px` }}>{renderSignedOut()}</Box>
          )}
          <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
            {positions.length === 0 && (
              <Typography sx={{ fontSize: 14, color: tc.textMuted, textAlign: "center", py: 2 }}>
                No positions are currently open for this plan.
              </Typography>
            )}
            {positions.map(renderPosition)}
          </Box>
        </>
      )}

      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError(null)}
        message={error || ""}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
      <Snackbar
        open={!!snack}
        autoHideDuration={2500}
        onClose={() => setSnack(null)}
        message={snack || ""}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
};
