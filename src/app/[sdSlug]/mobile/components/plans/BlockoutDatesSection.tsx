"use client";

import React, { useState } from "react";
import { Box, Button, Skeleton, TextField, Typography } from "@mui/material";
import { ApiHelper, DateHelper, Locale } from "@churchapps/apphelper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PlateSection, QuietEmpty, Row, RowList, Sheet, TextLink } from "../kit";

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
    staleTime: 10 * 60 * 1000
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = (blockoutDates || []).filter((b) => DateHelper.toDate(b.endDate) >= today);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/blockoutdates/my", "DoingApi"] });
  };

  const handleSave = async () => {
    if (!startDate || !endDate) return;
    setSaving(true);
    try {
      await ApiHelper.post("/blockoutDates", [{ startDate, endDate }], "DoingApi");
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

  const formatRange = (b: BlockoutDate) => {
    const start = DateHelper.prettyDate(DateHelper.toDate(b.startDate));
    return b.endDate && b.endDate !== b.startDate ? `${start} – ${DateHelper.prettyDate(DateHelper.toDate(b.endDate))}` : start;
  };

  return (
    <PlateSection
      title={Locale.label("mobile.serving.blockoutDates")}
      action={<TextLink onClick={() => setShowForm(true)}>{Locale.label("mobile.serving.addDates")}</TextLink>}
    >
      {isLoading && blockoutDates === null ? (
        <Box>{[0, 1].map((i) => <Skeleton key={i} variant="text" width="50%" height={24} />)}</Box>
      ) : upcoming.length === 0 ? (
        <QuietEmpty>{Locale.label("mobile.serving.noBlockouts")}</QuietEmpty>
      ) : (
        <RowList>
          {upcoming.map((b) => (
            <Row
              key={b.id}
              title={formatRange(b)}
              subtitle={b.notes}
              trailing={<TextLink danger onClick={() => setDeleteId(b.id)} aria-label={Locale.label("mobile.plans.deleteBlockout")}>{Locale.label("mobile.details.remove")}</TextLink>}
            />
          ))}
        </RowList>
      )}

      <Sheet
        open={showForm}
        onClose={() => !saving && setShowForm(false)}
        title={Locale.label("mobile.serving.addBlockoutTitle")}
        actions={<>
          <Button variant="outlined" onClick={() => setShowForm(false)} disabled={saving}>{Locale.label("mobile.screens.cancel")}</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !startDate || !endDate}>
            {saving ? Locale.label("mobile.serving.saving") : Locale.label("mobile.screens.save")}
          </Button>
        </>}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: "14px", pt: "6px" }}>
          <TextField label={Locale.label("mobile.plans.startDate")} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
          <TextField label={Locale.label("mobile.plans.endDate")} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
        </Box>
      </Sheet>

      <Sheet
        open={!!deleteId}
        onClose={() => !deleting && setDeleteId(null)}
        title={Locale.label("mobile.plans.deleteBlockoutTitle")}
        maxWidth="xs"
        actions={<>
          <Button variant="outlined" onClick={() => setDeleteId(null)} disabled={deleting}>{Locale.label("mobile.screens.cancel")}</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? Locale.label("mobile.serving.deleting") : Locale.label("mobile.details.delete")}
          </Button>
        </>}
      >
        <Typography>{Locale.label("mobile.serving.deleteBlockoutBody")}</Typography>
      </Sheet>
    </PlateSection>
  );
};
