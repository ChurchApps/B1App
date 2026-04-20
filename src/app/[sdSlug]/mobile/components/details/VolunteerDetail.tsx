"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Icon,
  IconButton,
  Skeleton,
  Typography
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { ApiHelper, DateHelper, UserHelper } from "@churchapps/apphelper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AssignmentInterface,
  PlanInterface,
  PositionInterface,
  TimeInterface
} from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import UserContext from "@/context/UserContext";
import { mobileTheme } from "../mobileTheme";

interface Props {
  id: string;
  config: ConfigurationInterface;
}

interface SignupPlanData {
  plan: PlanInterface & { signupDeadlineHours?: number; notes?: string };
  positions: (PositionInterface & { filledCount: number })[];
  times: TimeInterface[];
}

export const VolunteerDetail = ({ id, config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const userContext = React.useContext(UserContext);
  const queryClient = useQueryClient();

  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionId, setActionId] = React.useState<string | null>(null);
  const [pendingRemoval, setPendingRemoval] = React.useState<AssignmentInterface | null>(null);

  const personId = userContext?.person?.id || UserHelper.currentUserChurch?.person?.id || "";
  const signedIn = !!personId;
  const churchId = config?.church?.id;

  interface SignupBundle {
    plan: SignupPlanData["plan"] | null;
    positions: (PositionInterface & { filledCount: number })[];
    times: TimeInterface[];
    myAssignments: AssignmentInterface[];
  }

  const { data: bundle, isLoading: loading } = useQuery<SignupBundle>({
    queryKey: ["volunteer-detail", churchId, id, signedIn],
    queryFn: async () => {
      const data: SignupPlanData[] = await ApiHelper.getAnonymous("/plans/public/signup/" + churchId, "DoingApi");
      const match = Array.isArray(data) ? data.find((d) => d?.plan?.id === id) : null;
      if (!match) return { plan: null, positions: [], times: [], myAssignments: [] };
      let myAssignments: AssignmentInterface[] = [];
      if (signedIn) {
        try {
          const mine: AssignmentInterface[] = await ApiHelper.get("/assignments/my", "DoingApi");
          const positionIds = (match.positions || []).map((p) => p.id).filter(Boolean);
          if (Array.isArray(mine)) {
            myAssignments = mine.filter((a) => positionIds.includes(a.positionId));
          }
        } catch {
          myAssignments = [];
        }
      }
      return {
        plan: match.plan,
        positions: match.positions || [],
        times: match.times || [],
        myAssignments
      };
    },
    enabled: !!churchId && !!id
  });

  const plan = bundle?.plan ?? null;
  const positions = bundle?.positions ?? [];
  const times = bundle?.times ?? [];
  const myAssignments = bundle?.myAssignments ?? [];
  const notFound = !loading && bundle !== undefined && !plan;

  const load = () => queryClient.invalidateQueries({ queryKey: ["volunteer-detail", churchId, id, signedIn] });

  const isDeadlinePassed = React.useMemo(() => {
    if (!plan?.signupDeadlineHours || !plan?.serviceDate) return false;
    const deadline = new Date(plan.serviceDate);
    deadline.setHours(deadline.getHours() - (plan.signupDeadlineHours || 0));
    return new Date() > deadline;
  }, [plan]);

  const getMyAssignment = (positionId?: string) =>
    positionId ? myAssignments.find((a) => a.positionId === positionId) : undefined;

  const handleSignup = async (pos: PositionInterface & { filledCount: number }) => {
    if (!pos.id || !signedIn) return;
    setActionId(pos.id);
    setMessage(null);
    try {
      await ApiHelper.post("/assignments/signup", { positionId: pos.id }, "DoingApi");
      setMessage({ type: "success", text: "You've been signed up!" });
      await load();
    } catch (err: any) {
      const msg = (err?.message || err?.toString() || "").toLowerCase();
      let text = "Sign up failed.";
      if (msg.includes("full")) text = "This position is full.";
      else if (msg.includes("deadline")) text = "The signup deadline has passed.";
      else if (msg.includes("already")) text = "You're already signed up.";
      setMessage({ type: "error", text });
    } finally {
      setActionId(null);
    }
  };

  // Staged behind a confirmation Dialog rather than window.confirm — the
  // native prompt is blocked in PWA-standalone and some WebView wrappers.
  const requestRemove = (assignment: AssignmentInterface) => {
    if (!assignment.id) return;
    setPendingRemoval(assignment);
  };

  const confirmRemove = async () => {
    const assignment = pendingRemoval;
    setPendingRemoval(null);
    if (!assignment?.id) return;
    setActionId(assignment.id);
    setMessage(null);
    try {
      await ApiHelper.delete(`/assignments/signup/${assignment.id}`, "DoingApi");
      setMessage({ type: "success", text: "Your signup has been removed." });
      await load();
    } catch (err: any) {
      const msg = (err?.message || err?.toString() || "").toLowerCase();
      const text = msg.includes("deadline") ? "The deadline has passed." : "Could not remove signup.";
      setMessage({ type: "error", text });
    } finally {
      setActionId(null);
    }
  };

  const categories = React.useMemo(() => {
    const map: Record<string, (PositionInterface & { filledCount: number })[]> = {};
    positions.forEach((p) => {
      const cat = p.categoryName || "General";
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    });
    return map;
  }, [positions]);

  const serviceDateStr = plan?.serviceDate
    ? DateHelper.prettyDate(DateHelper.toDate(plan.serviceDate))
    : "";
  const timesStr = times.length > 0 ? times.map((t) => (t as any).displayName || "").filter(Boolean).join(", ") : "";

  const renderHeader = () => (
    <Box>
      <Typography sx={{ fontSize: 24, fontWeight: 700, color: tc.text, mb: "4px" }}>{plan?.name}</Typography>
      <Typography sx={{ fontSize: 15, color: tc.textMuted, mb: plan?.notes ? "8px" : 0 }}>
        {serviceDateStr}
        {timesStr && ` · ${timesStr}`}
      </Typography>
      {plan?.notes && (
        <Typography sx={{ fontSize: 14, color: tc.textMuted, whiteSpace: "pre-wrap" }}>
          {plan.notes}
        </Typography>
      )}
    </Box>
  );

  const renderAlert = (type: "warning" | "info" | "success" | "error", text: string, icon: string) => {
    const colors = {
      warning: { bg: "rgba(254,170,36,0.15)", fg: tc.warning },
      info: { bg: "rgba(86,139,218,0.15)", fg: tc.primary },
      success: { bg: "rgba(112,220,135,0.2)", fg: tc.success },
      error: { bg: "rgba(176,18,12,0.15)", fg: tc.error }
    }[type];
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          bgcolor: colors.bg,
          color: colors.fg,
          borderRadius: `${mobileTheme.radius.md}px`,
          p: `${mobileTheme.spacing.sm}px`
        }}
      >
        <Icon sx={{ color: colors.fg }}>{icon}</Icon>
        <Typography sx={{ fontSize: 14, color: colors.fg, flex: 1 }}>{text}</Typography>
      </Box>
    );
  };

  const renderPosition = (p: PositionInterface & { filledCount: number }) => {
    const needed = (p as any).count || 0;
    const filled = p.filledCount || 0;
    const remaining = Math.max(0, needed - filled);
    const percent = needed > 0 ? Math.min(100, (filled / needed) * 100) : 0;
    const isFull = remaining === 0 && needed > 0;
    const mine = getMyAssignment(p.id);
    const busy = actionId === p.id || (mine?.id ? actionId === mine.id : false);

    return (
      <Box
        key={p.id}
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`,
          border: mine ? `1px solid ${tc.success}` : "none"
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: tc.text }}>{p.name}</Typography>
              {mine && (
                <Box
                  sx={{
                    px: 1,
                    py: "2px",
                    borderRadius: "999px",
                    bgcolor: "rgba(112,220,135,0.2)",
                    color: tc.success,
                    fontSize: 11,
                    fontWeight: 700
                  }}
                >
                  Signed up
                </Box>
              )}
            </Box>
            {p.description && (
              <Typography sx={{ fontSize: 13, color: tc.textMuted, mt: "4px" }}>{p.description}</Typography>
            )}
          </Box>
          {mine ? (
            <Button
              variant="outlined"
              size="small"
              disabled={isDeadlinePassed || busy}
              onClick={() => requestRemove(mine)}
              sx={{
                color: tc.error,
                borderColor: tc.error,
                textTransform: "none",
                fontWeight: 600,
                borderRadius: `${mobileTheme.radius.md}px`,
                flexShrink: 0
              }}
            >
              {busy ? "Removing..." : "Remove"}
            </Button>
          ) : (
            <Button
              variant="contained"
              size="small"
              disabled={isFull || isDeadlinePassed || !signedIn || busy}
              onClick={() => handleSignup(p)}
              sx={{
                bgcolor: tc.primary,
                color: tc.onPrimary,
                textTransform: "none",
                fontWeight: 600,
                borderRadius: `${mobileTheme.radius.md}px`,
                flexShrink: 0,
                "&:hover": { bgcolor: tc.primary },
                "&.Mui-disabled": { bgcolor: tc.disabled, color: "#FFF" }
              }}
            >
              {busy ? "Signing Up..." : isFull ? "Full" : "Sign Up"}
            </Button>
          )}
        </Box>

        {/* Progress */}
        <Box sx={{ mt: 1.5 }}>
          <Box
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: tc.border,
              overflow: "hidden"
            }}
          >
            <Box
              sx={{
                height: "100%",
                width: `${percent}%`,
                bgcolor: isFull ? tc.error : tc.primary,
                transition: "width 300ms ease"
              }}
            />
          </Box>
          <Typography sx={{ fontSize: 12, color: tc.textMuted, mt: "4px" }}>
            {remaining > 0 ? `${remaining} of ${needed} slots remaining` : `All ${needed} slots filled`}
          </Typography>
        </Box>
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
        p: `${mobileTheme.spacing.md}px`
      }}
    >
      <Skeleton variant="text" width="60%" height={20} />
      <Skeleton variant="text" width="40%" height={14} />
      <Skeleton variant="rounded" height={32} sx={{ mt: 1.5 }} />
    </Box>
  );

  const renderNotFound = () => (
    <Box
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.xl}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.lg}px`,
        textAlign: "center"
      }}
    >
      <Icon sx={{ fontSize: 48, color: tc.textSecondary }}>event_busy</Icon>
      <Typography sx={{ fontSize: 16, fontWeight: 600, color: tc.text, mt: 1 }}>
        Plan not found
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: `${mobileTheme.spacing.sm}px` }}>
        <IconButton aria-label="Back" onClick={() => router.back()} sx={{ color: tc.text }} size="small">
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
        <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.md}px` }}>
          {renderHeader()}
          {isDeadlinePassed && renderAlert("warning", "Signup deadline has passed.", "schedule")}
          {!signedIn && renderAlert("info", "Sign in to sign up for a position.", "info")}
          {message && renderAlert(message.type, message.text, message.type === "success" ? "check_circle" : "error")}

          {Object.entries(categories).map(([cat, list]) => (
            <Box key={cat}>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: tc.text, mb: 1 }}>{cat}</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
                {list.map(renderPosition)}
              </Box>
            </Box>
          ))}

          {positions.length === 0 && (
            <Typography sx={{ textAlign: "center", color: tc.textMuted, py: 3 }}>
              No positions are currently available.
            </Typography>
          )}
        </Box>
      )}

      <Dialog
        open={!!pendingRemoval}
        onClose={() => setPendingRemoval(null)}
        aria-labelledby="remove-signup-title"
      >
        <DialogTitle id="remove-signup-title">Remove signup?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove your signup for this position?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingRemoval(null)} sx={{ color: tc.textMuted, textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={confirmRemove}
            sx={{ color: tc.error, textTransform: "none", fontWeight: 600 }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VolunteerDetail;
