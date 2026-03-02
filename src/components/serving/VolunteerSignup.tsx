"use client";

import React, { useState, useContext } from "react";
import {
  Card, CardContent, Typography, Stack, Button, LinearProgress, Box, Alert,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Chip
} from "@mui/material";
import { ApiHelper, DateHelper, PersonHelper } from "@churchapps/apphelper";
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
      setMessage({ type: "success", text: "You're signed up! Thank you for volunteering." });
      await refreshData();
    } catch (err: any) {
      const errMsg = err?.message || err?.toString() || "Signup failed";
      if (errMsg.includes("full")) setMessage({ type: "error", text: "This position is now full." });
      else if (errMsg.includes("deadline")) setMessage({ type: "error", text: "The signup deadline has passed." });
      else if (errMsg.includes("Already")) setMessage({ type: "error", text: "You are already signed up for this position." });
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
      setMessage({ type: "success", text: "You have been removed from this position." });
      await refreshData();
    } catch (err: any) {
      const errMsg = err?.message || err?.toString() || "Removal failed";
      if (errMsg.includes("deadline")) setMessage({ type: "error", text: "The removal deadline has passed." });
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
    const cat = p.categoryName || "General";
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
      {deadlinePassed && <Alert severity="warning" sx={{ mb: 2 }}>The signup deadline for this plan has passed.</Alert>}

      {message && <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>{message.text}</Alert>}

      {!isLoggedIn && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Link href={`/login/?returnUrl=${encodeURIComponent(pathname)}`}>Log in</Link> to sign up for a position.
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
                          {isSignedUp && <Chip label="You're signed up" color="success" size="small" />}
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
                            {loading === myAssignment.id ? "Removing..." : "Remove"}
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            size="small"
                            disabled={isFull || deadlinePassed || !isLoggedIn || loading === position.id}
                            onClick={() => handleSignup(position.id)}
                            sx={{ textTransform: "none", borderRadius: 2 }}
                          >
                            {loading === position.id ? "Signing up..." : isFull ? "Full" : "Sign Up"}
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
                        {remaining > 0 ? remaining + " of " + position.count + " slots remaining" : "All " + position.count + " slots filled"}
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
        <DialogTitle>Remove yourself?</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to remove yourself from this position?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRemoveId(null)}>Cancel</Button>
          <Button onClick={() => handleRemove(confirmRemoveId)} color="error" variant="contained">Remove</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
