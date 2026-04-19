"use client";

import React, { useState } from "react";
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
  TextField,
  Typography,
} from "@mui/material";
import { ApiHelper, DateHelper } from "@churchapps/apphelper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { mobileTheme } from "../mobileTheme";

interface BlockoutDate {
  id: string;
  churchId?: string;
  personId?: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

interface Props {
  enabled: boolean;
}

const todayHtml5 = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const BlockoutDatesSection = ({ enabled }: Props) => {
  const tc = mobileTheme.colors;
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState<string>(todayHtml5());
  const [endDate, setEndDate] = useState<string>(todayHtml5());
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: blockoutDates = null, isLoading } = useQuery<BlockoutDate[]>({
    queryKey: ["/blockoutdates/my", "DoingApi"],
    queryFn: async () => {
      const data = await ApiHelper.get("/blockoutdates/my", "DoingApi");
      return Array.isArray(data) ? data : [];
    },
    enabled,
    staleTime: 10 * 60 * 1000,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = (blockoutDates || []).filter((b) => {
    const end = DateHelper.toDate(b.endDate);
    return end >= today;
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/blockoutdates/my", "DoingApi"] });
  };

  const handleSave = async () => {
    if (!startDate || !endDate) return;
    setSaving(true);
    try {
      await ApiHelper.post(
        "/blockoutDates",
        [{ startDate, endDate }],
        "DoingApi"
      );
      setShowForm(false);
      setStartDate(todayHtml5());
      setEndDate(todayHtml5());
      refresh();
    } catch (err) {
      console.error("Error adding blockout:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await ApiHelper.delete("/blockoutDates/" + deleteId, "DoingApi");
      setDeleteId(null);
      refresh();
    } catch (err) {
      console.error("Error deleting blockout:", err);
    } finally {
      setDeleting(false);
    }
  };

  const renderHeader = () => (
    <Box sx={{ display: "flex", alignItems: "center", mb: `${mobileTheme.spacing.md}px`, pl: 0.5 }}>
      <Icon sx={{ color: tc.primary, mr: 1, fontSize: 24 }}>event_busy</Icon>
      <Typography sx={{ fontSize: 18, fontWeight: 700, color: tc.text }}>
        Blockout Dates
      </Typography>
    </Box>
  );

  const renderEmpty = () => (
    <Box sx={{ textAlign: "center", p: `${mobileTheme.spacing.lg}px` }}>
      <Icon sx={{ fontSize: 48, color: tc.disabled }}>event_busy</Icon>
      <Typography sx={{ fontSize: 16, fontWeight: 600, color: tc.text, mt: 2 }}>
        No blockout dates set
      </Typography>
      <Typography sx={{ fontSize: 14, color: tc.disabled, mt: 1, mb: 3 }}>
        Block dates when you&apos;re unavailable to serve.
      </Typography>
      <Button
        variant="contained"
        startIcon={<Icon>add</Icon>}
        onClick={() => setShowForm(true)}
        sx={{
          bgcolor: tc.primary,
          color: tc.onPrimary,
          borderRadius: `${mobileTheme.radius.lg}px`,
          textTransform: "none",
          fontWeight: 600,
          px: 2,
          "&:hover": { bgcolor: tc.primary },
        }}
      >
        Add blockout date
      </Button>
    </Box>
  );

  const renderSkeleton = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {[0, 1].map((i) => (
        <Skeleton key={i} variant="rounded" height={56} />
      ))}
    </Box>
  );

  const renderForm = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <TextField
        label="Start date"
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
        size="small"
        fullWidth
      />
      <TextField
        label="End date"
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
        size="small"
        fullWidth
      />
      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mt: 0.5 }}>
        <Button
          variant="outlined"
          onClick={() => setShowForm(false)}
          sx={{ textTransform: "none", borderRadius: `${mobileTheme.radius.md}px` }}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !startDate || !endDate}
          sx={{
            bgcolor: tc.primary,
            color: tc.onPrimary,
            borderRadius: `${mobileTheme.radius.md}px`,
            textTransform: "none",
            fontWeight: 600,
            "&:hover": { bgcolor: tc.primary },
          }}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </Box>
    </Box>
  );

  const renderList = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography sx={{ fontSize: 14, color: tc.disabled, fontWeight: 500 }}>
          {upcoming.length} upcoming
        </Typography>
        <Button
          size="small"
          startIcon={<Icon>add</Icon>}
          onClick={() => setShowForm(true)}
          sx={{
            color: tc.primary,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Add new
        </Button>
      </Box>

      {upcoming.map((b) => (
        <Box
          key={b.id}
          sx={{
            display: "flex",
            alignItems: "center",
            bgcolor: tc.surface,
            borderRadius: `${mobileTheme.radius.lg}px`,
            boxShadow: mobileTheme.shadows.sm,
            p: `${mobileTheme.spacing.md}px`,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0, mr: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Icon sx={{ color: tc.error, fontSize: 20, mr: 1 }}>event_busy</Icon>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: tc.text }}>
                {DateHelper.prettyDate(DateHelper.toDate(b.startDate))}
                {b.endDate && b.endDate !== b.startDate
                  ? ` - ${DateHelper.prettyDate(DateHelper.toDate(b.endDate))}`
                  : ""}
              </Typography>
            </Box>
            {b.notes && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  bgcolor: `${tc.disabled}14`,
                  borderRadius: `${mobileTheme.radius.md}px`,
                  p: 1.5,
                  mt: 1,
                }}
              >
                <Icon sx={{ color: tc.disabled, fontSize: 16, mr: 1, mt: 0.25 }}>note</Icon>
                <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
                  {b.notes}
                </Typography>
              </Box>
            )}
          </Box>
          <IconButton
            onClick={() => setDeleteId(b.id)}
            aria-label="Delete blockout"
            sx={{ color: tc.error }}
          >
            <Icon>delete_outline</Icon>
          </IconButton>
        </Box>
      ))}
    </Box>
  );

  return (
    <Box sx={{ mb: `${mobileTheme.spacing.lg}px` }}>
      {renderHeader()}
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.xl}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`,
        }}
      >
        {isLoading && blockoutDates === null
          ? renderSkeleton()
          : showForm
            ? renderForm()
            : upcoming.length === 0
              ? renderEmpty()
              : renderList()}
      </Box>

      <Dialog open={!!deleteId} onClose={() => !deleting && setDeleteId(null)}>
        <DialogTitle>Delete blockout date?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this blockout date? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} disabled={deleting} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            sx={{ color: tc.error, textTransform: "none", fontWeight: 600 }}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
