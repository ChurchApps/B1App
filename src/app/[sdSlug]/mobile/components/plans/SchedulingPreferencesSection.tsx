"use client";

import React, { useState } from "react";
import { Box, Button, MenuItem, Skeleton, TextField, Typography } from "@mui/material";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  hasPreferences,
  isPreferenceFormValid,
  toPreferenceForm,
  toPreferencePayload,
  type HouseholdScheduling,
  type SchedulingPreference,
  type SchedulingPreferenceForm
} from "@/helpers/schedulingPreferences";
import { mobileTheme } from "../mobileTheme";
import { KeyValues, PlateSection, QuietEmpty, Sheet, TextLink } from "../kit";

interface Props {
  enabled: boolean;
}

const queryKey = ["/schedulingPreferences/my", "DoingApi"];

const householdLabel = (value: HouseholdScheduling) => {
  if (value === "together") return Locale.label("mobile.serving.householdTogether");
  if (value === "apart") return Locale.label("mobile.serving.householdApart");
  return Locale.label("mobile.serving.householdNone");
};

export const SchedulingPreferencesSection = ({ enabled }: Props) => {
  const tc = mobileTheme.colors;
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SchedulingPreferenceForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { data: preference, isLoading } = useQuery<SchedulingPreference | null>({
    queryKey,
    queryFn: async () => {
      const data = await ApiHelper.get("/schedulingPreferences/my", "DoingApi");
      return data && typeof data === "object" && !Array.isArray(data) ? data : null;
    },
    enabled,
    staleTime: 10 * 60 * 1000
  });

  const current = toPreferenceForm(preference);
  const open = () => { setError(""); setForm(toPreferenceForm(preference)); };
  const close = () => { if (!saving) setForm(null); };

  const handleSave = async () => {
    if (!form || !isPreferenceFormValid(form)) return;
    setSaving(true);
    setError("");
    try {
      await ApiHelper.post("/schedulingPreferences", [toPreferencePayload(form)], "DoingApi");
      await queryClient.invalidateQueries({ queryKey });
      setForm(null);
    } catch {
      setError(Locale.label("mobile.serving.preferencesSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const maxInvalid = !!form && !isPreferenceFormValid(form);

  return (
    <PlateSection
      title={Locale.label("mobile.serving.schedulingPreferences")}
      action={<TextLink onClick={open} data-testid="plans-preferences-edit">{Locale.label("mobile.details.edit")}</TextLink>}
      data-testid="plans-preferences"
    >
      {isLoading && preference === undefined ? (
        <Box>{[0, 1].map((i) => <Skeleton key={i} variant="text" width="55%" height={24} />)}</Box>
      ) : !hasPreferences(preference) ? (
        <QuietEmpty>{Locale.label("mobile.serving.noPreferences")}</QuietEmpty>
      ) : (
        <KeyValues
          items={[
            { label: Locale.label("mobile.serving.maxPerMonth"), value: current.maxPerMonth || Locale.label("mobile.serving.noLimit") },
            { label: Locale.label("mobile.serving.preferredTimes"), value: current.preferredTimes || Locale.label("mobile.serving.anyTime") },
            { label: Locale.label("mobile.serving.household"), value: householdLabel(current.householdScheduling) }
          ]}
        />
      )}

      <Sheet
        open={!!form}
        onClose={close}
        title={Locale.label("mobile.serving.schedulingPreferences")}
        actions={<>
          <Button variant="outlined" onClick={close} disabled={saving}>{Locale.label("mobile.screens.cancel")}</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || maxInvalid} data-testid="plans-preferences-save">
            {saving ? Locale.label("mobile.serving.saving") : Locale.label("mobile.screens.save")}
          </Button>
        </>}
      >
        {form && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: "14px", pt: "6px" }}>
            <Typography sx={{ fontSize: 14, color: tc.textSecondary }}>{Locale.label("mobile.serving.preferencesLede")}</Typography>
            <TextField
              label={Locale.label("mobile.serving.maxPerMonth")}
              value={form.maxPerMonth}
              onChange={(e) => setForm({ ...form, maxPerMonth: e.target.value })}
              error={maxInvalid}
              helperText={maxInvalid ? Locale.label("mobile.serving.maxPerMonthInvalid") : Locale.label("mobile.serving.maxPerMonthHelper")}
              slotProps={{ htmlInput: { inputMode: "numeric", pattern: "[0-9]*", "data-testid": "plans-preferences-max" } }}
              fullWidth
            />
            <TextField
              label={Locale.label("mobile.serving.preferredTimes")}
              value={form.preferredTimes}
              onChange={(e) => setForm({ ...form, preferredTimes: e.target.value })}
              helperText={Locale.label("mobile.serving.preferredTimesHelper")}
              slotProps={{ htmlInput: { "data-testid": "plans-preferences-times" } }}
              fullWidth
            />
            <TextField
              select
              label={Locale.label("mobile.serving.household")}
              value={form.householdScheduling}
              onChange={(e) => setForm({ ...form, householdScheduling: e.target.value as HouseholdScheduling })}
              slotProps={{ select: { SelectDisplayProps: { "data-testid": "plans-preferences-household" } as React.HTMLAttributes<HTMLDivElement> } }}
              fullWidth
            >
              {(["none", "together", "apart"] as HouseholdScheduling[]).map((v) => <MenuItem key={v} value={v}>{householdLabel(v)}</MenuItem>)}
            </TextField>
            {error && <Typography role="alert" sx={{ fontSize: 13.5, color: tc.error }}>{error}</Typography>}
          </Box>
        )}
      </Sheet>
    </PlateSection>
  );
};
