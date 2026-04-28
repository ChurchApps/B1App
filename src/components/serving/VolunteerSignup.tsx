"use client";

import React, { useState, useContext } from "react";
import {
  Card, CardContent, Typography, Stack, Button, LinearProgress, Box, Alert,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Chip
} from "@mui/material";
import { ApiHelper, DateHelper, Locale } from "@churchapps/apphelper";
import type { PlanInterface, PositionInterface, TimeInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface PositionWithCount extends PositionInterface {
  filledCount: number;
}

interface SignupPlanData {
  plan: PlanInterface;
  positions: PositionWithCount[];
  times: TimeInterface[];
}

interface Props {
  planData: SignupPlanData;
  churchId: string;
}

export function VolunteerSignup({ planData: initialData, churchId }: Props) {
  const context = useContext(UserContext);
  const pathname = usePathname();
  const [planData, setPlanData] = useState<SignupPlanData>(initialData);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [myAssignments, setMyAssignments] = useState<any[]>([]);
  const [assignmentsLoaded, setAssignmentsLoaded] = useState(false);

  const isLoggedIn = !!context.userChurch?.jwt;
  const personId = context.person?.id;
  const { plan, positions, times } = planData;

  // Load user's assignments for this plan
  React.useEffect(() => {
    if (isLoggedIn && !assignmentsLoaded) {
      ApiHelper.get("/assignments/my", "DoingApi").then((data: any[]) => {
        const planPositionIds = positions.map(p => p.id);
        const relevant = data.filter(a => planPositionIds.includes(a.positionId));
        setMyAssignments(relevant);
        setAssignmentsLoaded(true);
      });
    }
  }, [isLoggedIn, assignmentsLoaded, positions]);

  const refreshData = async () => {
    const allPlans = await ApiHelper.getAnonymous("/plans/public/signup/" + churchId, "DoingApi");
    const updated = (allPlans || []).find((sp: any) => sp.plan.id === plan.id);
    if (updated) setPlanData(updated);

    if (isLoggedIn) {
      const data = await ApiHelper.get("/assignments/my", "DoingApi");
      const planPositionIds = positions.map(p => p.id);
      setMyAssignments(data.filter((a: any) => planPositionIds.includes(a.positionId)));
    }
  };

  const handleSignup = async (positionId: string) => {
    if (!isLoggedIn) return;
    setLoading(positionId);
    setMessage(null);
    try {
      await ApiHelper.post("/assignments/signup", { positionId }, "DoingApi");
      setMessage({ type: "success", text: Locale.label("serving.signup.success") });
      await refreshData();
    } catch (err: any) {
      const errMsg = err?.message || err?.toString() || Locale.label("serving.signup.failed");
      if (errMsg.includes("full")) setMessage({ type: "error", text: Locale.label("serving.signup.positionFull") });
      else if (errMsg.includes("deadline")) setMessage({ type: "error", text: Locale.label("serving.signup.deadlinePassed") });
      else if (errMsg.includes("Already")) setMessage({ type: "error", text: Locale.label("serving.signup.alreadySignedUp") });
      else setMessage({ type: "error", text: errMsg });
    }
    setLoading(null);
  };

  const handleRemove = async (assignmentId: string) => {
    setConfirmRemoveId(null);
    setLoading(assignmentId);
    setMessage(null);
    try {
      await ApiHelper.delete("/assignments/signup/" + assignmentId, "DoingApi");
      setMessage({ type: "success", text: Locale.label("serving.remove.success") });
      await refreshData();
    } catch (err: any) {
      const errMsg = err?.message || err?.toString() || Locale.label("serving.remove.failed");
      if (errMsg.includes("deadline")) setMessage({ type: "error", text: Locale.label("serving.remove.deadlinePassed") });
      else setMessage({ type: "error", text: errMsg });
    }
    setLoading(null);
  };

  const getMyAssignment = (positionId: string) => myAssignments.find(a => a.positionId === positionId);

  const isDeadlinePassed = () => {
    if (!plan.signupDeadlineHours || !plan.serviceDate) return false;
    const deadline = new Date(plan.serviceDate);
    deadline.setHours(deadline.getHours() - plan.signupDeadlineHours);
    return new Date() > deadline;
  };

  const deadlinePassed = isDeadlinePassed();

  // Group positions by category
  const categories: Record<string, PositionWithCount[]> = {};
  positions.forEach(p => {
    const cat = p.categoryName || Locale.label("serving.generalCategory");
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(p);
  });

  return (
    <>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>{plan.name}</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
        {DateHelper.prettyDate(new Date(plan.serviceDate))}
        {times.length > 0 && (" \u00b7 " + times.map(t => t.displayName).join(", "))}
      </Typography>
      {plan.notes && <Typography variant="body2" sx={{ mb: 2 }}>{plan.notes}</Typography>}
      {deadlinePassed && <Alert severity="warning" sx={{ mb: 2 }}>{Locale.label("serving.signup.planDeadlinePassed")}</Alert>}

      {message && <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>{message.text}</Alert>}

      {!isLoggedIn && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Link href={`/login/?returnUrl=${encodeURIComponent(pathname)}`}>{Locale.label("serving.logIn")}</Link> {Locale.label("serving.toSignUp")}
        </Alert>
      )}

      {Object.entries(categories).map(([category, catPositions]) => (
        <Box key={category} sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>{category}</Typography>
          <Stack spacing={2}>
            {catPositions.map(position => {
              const remaining = (position.count || 0) - position.filledCount;
              const isFull = remaining <= 0;
              const progress = position.count > 0 ? (position.filledCount / position.count) * 100 : 0;
              const myAssignment = getMyAssignment(position.id);
              const isSignedUp = !!myAssignment;

              return (
                <Card key={position.id} sx={{ borderRadius: 2, border: "1px solid", borderColor: isSignedUp ? "success.main" : "divider" }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{position.name}</Typography>
                          {isSignedUp && <Chip label={Locale.label("serving.signedUpChip")} color="success" size="small" />}
                        </Stack>
                        {position.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{position.description}</Typography>
                        )}
                      </Box>
                      <Box sx={{ textAlign: "right", ml: 2 }}>
                        {isSignedUp ? (
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            disabled={deadlinePassed || loading === myAssignment.id}
                            onClick={() => setConfirmRemoveId(myAssignment.id)}
                            sx={{ textTransform: "none", borderRadius: 2 }}
                          >
                            {loading === myAssignment.id ? Locale.label("serving.removing") : Locale.label("serving.removeBtn")}
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            size="small"
                            disabled={isFull || deadlinePassed || !isLoggedIn || loading === position.id}
                            onClick={() => handleSignup(position.id)}
                            sx={{ textTransform: "none", borderRadius: 2 }}
                          >
                            {loading === position.id ? Locale.label("serving.signingUp") : isFull ? Locale.label("serving.full") : Locale.label("serving.signUp")}
                          </Button>
                        )}
                      </Box>
                    </Stack>
                    <Box sx={{ mt: 1.5 }}>
                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        color={isFull ? "error" : "primary"}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {remaining > 0
                          ? Locale.label("serving.slotsRemaining").replace("{remaining}", remaining.toString()).replace("{total}", position.count.toString())
                          : Locale.label("serving.allSlotsFilled").replace("{}", position.count.toString())}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        </Box>
      ))}

      <Dialog open={!!confirmRemoveId} onClose={() => setConfirmRemoveId(null)}>
        <DialogTitle>{Locale.label("serving.removeYourselfTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{Locale.label("serving.removeYourselfPrompt")}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRemoveId(null)}>{Locale.label("common.cancel")}</Button>
          <Button onClick={() => handleRemove(confirmRemoveId)} color="error" variant="contained">{Locale.label("serving.removeBtn")}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
