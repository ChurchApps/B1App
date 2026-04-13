"use client";
import React, { useContext, useState } from "react";
import {
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, Icon, Stack, TextField, Typography
} from "@mui/material";
import { ApiHelper } from "@churchapps/apphelper";
import UserContext from "@/context/UserContext";

export function AccountPage() {
  const context = useContext(UserContext);
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await ApiHelper.get("/gdpr/my/export", "MembershipApi");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-data-export.json";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await ApiHelper.delete("/gdpr/my/account", "MembershipApi");
      // Redirect to home after account deletion
      window.location.href = "/";
    } catch {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (!context?.person?.id) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography color="text.secondary">Please log in to manage your account.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        <Icon sx={{ verticalAlign: "middle", mr: 1 }}>manage_accounts</Icon>
        Account
      </Typography>

      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Download My Data</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Download a copy of all data associated with your account, including your profile,
              group memberships, donations, attendance, messages, and more.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Icon>download</Icon>}
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? "Preparing download..." : "Download My Data"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: "error.main" }}>Delete My Account</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Permanently delete your account and anonymize all associated data. Your donation
              history and attendance records will be retained for church reporting but will no
              longer be linked to your identity. This action cannot be undone.
            </Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Icon>delete_forever</Icon>}
              onClick={() => setDeleteOpen(true)}
            >
              Delete My Account
            </Button>
          </CardContent>
        </Card>
      </Stack>

      <Dialog open={deleteOpen} onClose={() => { if (!deleting) setDeleteOpen(false); }}>
        <DialogTitle>Delete Your Account?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            This will permanently delete your account and anonymize your data across all systems.
            You will be logged out and will not be able to recover your account.
          </DialogContentText>
          <DialogContentText sx={{ mb: 2, fontWeight: 600 }}>
            Type &quot;DELETE&quot; to confirm:
          </DialogContentText>
          <TextField
            fullWidth
            size="small"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            disabled={deleting}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
          <Button
            onClick={handleDelete}
            color="error"
            disabled={confirmText !== "DELETE" || deleting}
          >
            {deleting ? "Deleting..." : "Permanently Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
