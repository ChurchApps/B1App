"use client";
import React, { useContext, useEffect, useState } from "react";
import {
  Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, Divider, Icon, Stack, Typography
} from "@mui/material";
import { ApiHelper, DateHelper } from "@churchapps/apphelper";
import type { RegistrationInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";

export function RegistrationsPage() {
  const context = useContext(UserContext);
  const [registrations, setRegistrations] = useState<RegistrationInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const loadData = async () => {
    if (!context?.person?.id) return;
    setLoading(true);
    const data = await ApiHelper.get("/registrations/person/" + context.person.id, "ContentApi");
    setRegistrations(data || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [context?.person?.id]);

  const handleCancel = async () => {
    if (!cancelId) return;
    await ApiHelper.post("/registrations/" + cancelId + "/cancel", {}, "ContentApi");
    setCancelId(null);
    loadData();
  };

  const getStatusColor = (status: string): "success" | "warning" | "error" | "default" => {
    switch (status) {
      case "confirmed": return "success";
      case "pending": return "warning";
      case "cancelled": return "error";
      default: return "default";
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography color="text.secondary">Loading registrations...</Typography>
      </Box>
    );
  }

  const activeRegs = registrations.filter((r) => r.status !== "cancelled");
  const cancelledRegs = registrations.filter((r) => r.status === "cancelled");

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        <Icon sx={{ verticalAlign: "middle", mr: 1 }}>how_to_reg</Icon>
        My Registrations
      </Typography>

      {registrations.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <Icon sx={{ fontSize: 48, color: "grey.400", mb: 1 }}>event_available</Icon>
            <Typography color="text.secondary">You haven&apos;t registered for any events yet.</Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {activeRegs.map((reg) => (
            <Card key={reg.id}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>{reg.event?.title || "Event"}</Typography>
                    {reg.event?.start && (
                      <Typography variant="body2" color="text.secondary">
                        <Icon sx={{ fontSize: 14, verticalAlign: "text-bottom", mr: 0.5 }}>schedule</Icon>
                        {DateHelper.prettyDateTime(reg.event.start)}
                      </Typography>
                    )}
                  </Box>
                  <Chip label={reg.status} size="small" color={getStatusColor(reg.status)} />
                </Stack>

                {reg.members && reg.members.length > 0 && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Registered Members:</Typography>
                    {reg.members.map((m, i) => (
                      <Typography key={i} variant="body2" color="text.secondary">
                        {m.firstName} {m.lastName}
                      </Typography>
                    ))}
                  </>
                )}

                {reg.registeredDate && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                    Registered: {new Date(reg.registeredDate).toLocaleDateString()}
                  </Typography>
                )}

                {reg.status !== "cancelled" && (
                  <Button
                    size="small"
                    color="error"
                    onClick={() => setCancelId(reg.id)}
                    sx={{ mt: 1 }}
                    startIcon={<Icon>cancel</Icon>}
                  >
                    Cancel Registration
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}

          {cancelledRegs.length > 0 && (
            <>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Cancelled</Typography>
              {cancelledRegs.map((reg) => (
                <Card key={reg.id} sx={{ opacity: 0.6 }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body1">{reg.event?.title || "Event"}</Typography>
                      <Chip label="cancelled" size="small" color="error" />
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </Stack>
      )}

      <Dialog open={!!cancelId} onClose={() => setCancelId(null)}>
        <DialogTitle>Cancel Registration?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this registration? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelId(null)}>Keep</Button>
          <Button onClick={handleCancel} color="error">Cancel Registration</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
