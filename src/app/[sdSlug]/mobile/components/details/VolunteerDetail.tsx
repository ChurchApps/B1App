"use client";

import React from "react";
import { Box, Button, Skeleton, Typography } from "@mui/material";
import { ApiHelper, DateHelper, Locale, UserHelper } from "@churchapps/apphelper";
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
import { PageHead, Plate, PlateSection, QuietEmpty, Row, RowList, Sheet, StatusBadge, TextLink } from "../kit";

interface Props {
  id: string;
  config: ConfigurationInterface;
}

interface SignupPlanData {
  plan: PlanInterface & { signupDeadlineHours?: number; notes?: string; showVolunteerNames?: boolean };
  positions: (PositionInterface & { filledCount: number })[];
  times: TimeInterface[];
}

export const VolunteerDetail = ({ id, config }: Props) => {
  const tc = mobileTheme.colors;
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
    volunteerNames: Record<string, string[]>;
  }

  const { data: bundle, isLoading: loading } = useQuery<SignupBundle>({
    queryKey: ["volunteer-detail", churchId, id, signedIn],
    queryFn: async () => {
      const data: SignupPlanData[] = await ApiHelper.getAnonymous("/plans/public/signup/" + churchId, "DoingApi");
      const match = Array.isArray(data) ? data.find((d) => d?.plan?.id === id) : null;
      if (!match) return { plan: null, positions: [], times: [], myAssignments: [], volunteerNames: {} };
      let myAssignments: AssignmentInterface[] = [];
      const volunteerNames: Record<string, string[]> = {};
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
        if (match.plan?.showVolunteerNames) {
          try {
            const rows: { positionId: string; names: string[] }[] = await ApiHelper.get(`/plans/signup/${id}/volunteers`, "DoingApi");
            if (Array.isArray(rows)) rows.forEach((r) => { volunteerNames[r.positionId] = r.names || []; });
          } catch {
            // names are optional
          }
        }
      }
      return {
        plan: match.plan,
        positions: match.positions || [],
        times: match.times || [],
        myAssignments,
        volunteerNames
      };
    },
    enabled: !!churchId && !!id
  });

  const plan = bundle?.plan ?? null;
  const positions = bundle?.positions ?? [];
  const times = bundle?.times ?? [];
  const myAssignments = bundle?.myAssignments ?? [];
  const volunteerNames = bundle?.volunteerNames ?? {};
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
      setMessage({ type: "success", text: Locale.label("mobile.details.signedUpSuccess") });
      await load();
    } catch (err: any) {
      const msg = (err?.message || err?.toString() || "").toLowerCase();
      let text = Locale.label("mobile.details.signupFailed");
      if (msg.includes("full")) text = Locale.label("mobile.details.positionFull");
      else if (msg.includes("deadline")) text = Locale.label("mobile.details.deadlinePassed");
      else if (msg.includes("already")) text = Locale.label("mobile.details.alreadySignedUp");
      setMessage({ type: "error", text });
    } finally {
      setActionId(null);
    }
  };

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
      setMessage({ type: "success", text: Locale.label("mobile.details.signupRemoved") });
      await load();
    } catch (err: any) {
      const msg = (err?.message || err?.toString() || "").toLowerCase();
      const text = msg.includes("deadline") ? Locale.label("mobile.details.deadlineHasPassed") : Locale.label("mobile.details.couldNotRemoveSignup");
      setMessage({ type: "error", text });
    } finally {
      setActionId(null);
    }
  };

  const categories = React.useMemo(() => {
    const map: Record<string, (PositionInterface & { filledCount: number })[]> = {};
    positions.forEach((p) => {
      const cat = p.categoryName || Locale.label("mobile.details.general");
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    });
    return map;
  }, [positions]);

  const serviceDateStr = plan?.serviceDate
    ? DateHelper.prettyDate(DateHelper.toDate(plan.serviceDate))
    : "";
  const timesStr = times.length > 0 ? times.map((t) => (t as any).displayName || "").filter(Boolean).join(", ") : "";

  const notices: { text: string; tone: "error" | "muted" | "success" }[] = [];
  if (isDeadlinePassed) notices.push({ text: Locale.label("mobile.details.signupDeadlinePassed"), tone: "muted" });
  if (!signedIn) notices.push({ text: Locale.label("mobile.details.signInToSignUp"), tone: "muted" });
  if (message) notices.push({ text: message.text, tone: message.type });

  const renderPosition = (p: PositionInterface & { filledCount: number }) => {
    const needed = (p as any).count || 0;
    const filled = p.filledCount || 0;
    const remaining = Math.max(0, needed - filled);
    const isFull = remaining === 0 && needed > 0;
    const mine = getMyAssignment(p.id);
    const busy = actionId === p.id || (mine?.id ? actionId === mine.id : false);
    const names = (p.id && volunteerNames[p.id]) || [];

    const trailing = mine ? (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flex: "none" }}>
        <StatusBadge tone="ok" dot>{Locale.label("mobile.details.signedUp")}</StatusBadge>
        <TextLink danger disabled={isDeadlinePassed || busy} onClick={() => requestRemove(mine)} sx={{ fontSize: 13.5 }}>
          {busy ? Locale.label("mobile.details.removing") : Locale.label("mobile.details.remove")}
        </TextLink>
      </Box>
    ) : isFull ? (
      <Button variant="outlined" size="small" disabled sx={{ flex: "none" }}>{Locale.label("mobile.details.full")}</Button>
    ) : (
      <Button variant="contained" size="small" disabled={isDeadlinePassed || !signedIn || busy} onClick={() => handleSignup(p)} sx={{ flex: "none" }}>
        {busy ? Locale.label("mobile.details.signingUp") : Locale.label("mobile.details.signUp")}
      </Button>
    );

    return (
      <Row
        key={p.id}
        title={p.name}
        subtitle={<>
          {Locale.label("mobile.serving.filledOf").replace("{}", String(filled)).replace("{}", String(needed))}
          {p.description && <Box component="span" sx={{ display: "block" }}>{p.description}</Box>}
          {names.length > 0 && (
            <Box component="span" sx={{ display: "block" }}>{Locale.label("mobile.details.signedUpNames").replace("{}", names.join(", "))}</Box>
          )}
        </>}
        trailing={trailing}
      />
    );
  };

  const renderBody = () => {
    if (loading) {
      return (
        <>
          <PageHead title={<Skeleton variant="text" width="60%" />} />
          <Plate>
            <PlateSection>
              {[0, 1, 2].map((i) => (
                <Box key={i} sx={{ py: "10px" }}>
                  <Skeleton variant="text" width="50%" height={22} />
                  <Skeleton variant="text" width="35%" height={18} />
                </Box>
              ))}
            </PlateSection>
          </Plate>
        </>
      );
    }
    if (notFound || !plan) {
      return (
        <PageHead title={Locale.label("mobile.details.planNotFound")}>
          <TextLink href="/mobile/volunteer">{Locale.label("mobile.screenTitles.volunteer")}</TextLink>
        </PageHead>
      );
    }
    return (
      <>
        <PageHead
          title={plan.name}
          lede={<>
            {serviceDateStr}{timesStr && ` · ${timesStr}`}
            {notices.map((n, i) => (
              <Typography
                key={i}
                role={n.tone === "error" ? "alert" : "status"}
                sx={{ mt: "6px", fontSize: 14, fontWeight: n.tone === "muted" ? 400 : 600, color: n.tone === "error" ? tc.error : n.tone === "success" ? tc.success : tc.textSecondary }}
              >
                {n.text}
              </Typography>
            ))}
          </>}
        />
        <Plate>
          {plan.notes && (
            <PlateSection>
              <Typography sx={{ fontSize: 15, lineHeight: "22px", color: tc.text, whiteSpace: "pre-wrap" }}>{plan.notes}</Typography>
            </PlateSection>
          )}
          {Object.entries(categories).map(([cat, list]) => (
            <PlateSection key={cat} title={cat}>
              <RowList>{list.map(renderPosition)}</RowList>
            </PlateSection>
          ))}
          {positions.length === 0 && (
            <PlateSection><QuietEmpty>{Locale.label("mobile.details.noPositionsAvailable")}</QuietEmpty></PlateSection>
          )}
        </Plate>
      </>
    );
  };

  return (
    <Box>
      {renderBody()}
      <Sheet
        open={!!pendingRemoval}
        onClose={() => setPendingRemoval(null)}
        title={Locale.label("mobile.details.removeSignup")}
        maxWidth="xs"
        actions={<>
          <Button variant="outlined" onClick={() => setPendingRemoval(null)}>{Locale.label("mobile.details.cancel")}</Button>
          <Button variant="contained" color="error" onClick={confirmRemove}>{Locale.label("mobile.details.remove")}</Button>
        </>}
      >
        <Typography>{Locale.label("mobile.details.confirmRemoveSignup")}</Typography>
      </Sheet>
    </Box>
  );
};

export default VolunteerDetail;
