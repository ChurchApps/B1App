"use client";

import React from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, TextField, Typography } from "@mui/material";
import { ApiHelper, CurrencyHelper, DateHelper } from "@churchapps/apphelper";
import type { CampaignProgressInterface, MyPledgeInterface } from "@/helpers/interfaces";

interface Props {
  churchId: string;
  isAuthenticated?: boolean;
  currency?: string;
}

const statusLabels: Record<string, string> = {
  notStarted: "Not started",
  inProgress: "In progress",
  fulfilled: "Fulfilled",
  beyondPledged: "Beyond pledged",
  nonPledged: ""
};

export const CampaignProgress: React.FC<Props> = ({ churchId, isAuthenticated = false, currency = "usd" }) => {
  const [campaigns, setCampaigns] = React.useState<CampaignProgressInterface[]>([]);
  const [myPledges, setMyPledges] = React.useState<MyPledgeInterface[]>([]);
  const [pledgeCampaignId, setPledgeCampaignId] = React.useState<string>(null);
  const [pledgeAmount, setPledgeAmount] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const loadData = React.useCallback(() => {
    if (!churchId) return;
    ApiHelper.getAnonymous("/campaigns/churchId/" + churchId, "GivingApi").then((data: CampaignProgressInterface[]) => {
      setCampaigns(Array.isArray(data) ? data : []);
    });
    if (isAuthenticated) {
      ApiHelper.get("/pledges/my", "GivingApi").then((data: MyPledgeInterface[]) => {
        setMyPledges(Array.isArray(data) ? data : []);
      });
    }
  }, [churchId, isAuthenticated]);

  React.useEffect(loadData, [loadData]);

  if (campaigns.length === 0) return null;

  const openPledgeDialog = (campaignId: string) => {
    const existing = myPledges.find((p) => p.pledge?.campaignId === campaignId);
    setPledgeAmount(existing?.pledge?.amount ? existing.pledge.amount.toString() : "");
    setPledgeCampaignId(campaignId);
  };

  const handleSavePledge = async () => {
    const amount = parseFloat(pledgeAmount);
    if (!amount || amount <= 0) return;
    setSaving(true);
    try {
      await ApiHelper.post("/pledges/my", { campaignId: pledgeCampaignId, amount }, "GivingApi");
      setPledgeCampaignId(null);
      setPledgeAmount("");
      loadData();
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date?: string) => (date ? DateHelper.prettyDate(new Date(date.toString().split("T")[0] + "T00:00:00")) : "");

  return (
    <Box data-testid="campaign-progress">
      {campaigns.map((cp) => {
        const c = cp.campaign || {};
        const percent = c.goalAmount ? Math.min(100, Math.round(((cp.totalGiven || 0) / c.goalAmount) * 100)) : null;
        const myPledge = myPledges.find((p) => p.pledge?.campaignId === c.id);
        const dateRange = formatDate(c.startDate) + (c.endDate ? " - " + formatDate(c.endDate) : "");

        return (
          <Box key={c.id} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2, mb: 2, bgcolor: "background.paper" }} data-testid={`campaign-card-${c.id}`}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, flexWrap: "wrap" }}>
              <Box>
                <Typography sx={{ fontSize: 17, fontWeight: 700 }}>{c.name}</Typography>
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{dateRange}</Typography>
              </Box>
              {isAuthenticated && c.allowSelfPledge && (
                <Button size="small" variant="outlined" onClick={() => openPledgeDialog(c.id)} data-testid={`pledge-button-${c.id}`}>
                  {myPledge ? "Update Pledge" : "Make a Pledge"}
                </Button>
              )}
            </Box>
            {c.description && <Typography sx={{ fontSize: 14, color: "text.secondary", mt: 1 }}>{c.description}</Typography>}
            {percent !== null && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1.5 }}>
                <LinearProgress variant="determinate" value={percent} sx={{ flex: 1, height: 10, borderRadius: 5 }} />
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{percent}%</Typography>
              </Box>
            )}
            <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 1 }}>
              {CurrencyHelper.formatCurrencyWithLocale(cp.totalGiven || 0, currency)} given
              {c.goalAmount ? " of " + CurrencyHelper.formatCurrencyWithLocale(c.goalAmount, currency) + " goal" : ""}
              {" • "}{CurrencyHelper.formatCurrencyWithLocale(cp.totalPledged || 0, currency)} pledged
            </Typography>
            {myPledge && (
              <Typography sx={{ fontSize: 13, fontWeight: 600, mt: 0.5 }} data-testid={`my-pledge-${c.id}`}>
                You pledged {CurrencyHelper.formatCurrencyWithLocale(myPledge.pledge?.amount || 0, currency)}
                {" • "}{CurrencyHelper.formatCurrencyWithLocale(myPledge.givenAmount || 0, currency)} given
                {statusLabels[myPledge.status] ? " • " + statusLabels[myPledge.status] : ""}
              </Typography>
            )}
          </Box>
        );
      })}

      <Dialog open={!!pledgeCampaignId} onClose={() => setPledgeCampaignId(null)} fullWidth maxWidth="xs">
        <DialogTitle>Make a Pledge</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: "text.secondary", mb: 2 }}>
            Pledge an amount you intend to give toward this campaign.
          </Typography>
          <TextField
            fullWidth
            autoFocus
            type="number"
            inputProps={{ step: "0.01", min: "0" }}
            label="Pledge Amount"
            value={pledgeAmount}
            onChange={(e) => setPledgeAmount(e.target.value)}
            data-testid="pledge-amount-input"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPledgeCampaignId(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSavePledge} disabled={saving || !parseFloat(pledgeAmount)} data-testid="save-pledge-button">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
