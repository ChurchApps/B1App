"use client";
import { useState, useEffect } from "react";
import { ApiHelper } from "@churchapps/apphelper";
import { UserHelper } from "@churchapps/apphelper";
import { Permissions } from "@churchapps/helpers";
import type { CuratedCalendarInterface } from "@churchapps/helpers";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
  Typography,
  IconButton,
  Divider,
  Alert,
  SelectChangeEvent
} from "@mui/material";
import {
  Save as SaveIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon
} from "@mui/icons-material";

type Props = {
  calendar: CuratedCalendarInterface;
  updatedCallback: (calendar: CuratedCalendarInterface) => void;
};

export function CalendarEdit(props: Props) {
  const [calendar, setCalendar] = useState<CuratedCalendarInterface>(null);
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleCancel = () => props.updatedCallback(calendar);
  const handleKeyDown = (e: React.KeyboardEvent<any>) => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    e.preventDefault();
    let b = { ...calendar };
    const val = e.target.value;
    switch (e.target.name) {
      case "name": b.name = val; break;
    }
    setCalendar(b);
  };

  const validate = () => {
    let errors = [];
    if (calendar.name === "") errors.push("Please enter a name.");
    if (!UserHelper.checkAccess(Permissions.contentApi.content.edit)) errors.push("Unauthorized to create calendars")
    setErrors(errors);
    return errors.length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      setSaving(true);
      ApiHelper.post("/curatedCalendars", [calendar], "ContentApi").then((data: any) => {
        setCalendar(data);
        setSaving(false);
        props.updatedCallback(data);
      }).catch(() => {
        setSaving(false);
      });
    }
  };

  const handleDelete = () => {
    let errors = [];
    if (!UserHelper.checkAccess(Permissions.contentApi.content.edit)) errors.push("Unauthorized to delete calendars");

    if (errors.length > 0) {
      setErrors(errors);
      return;
    }

    if (window.confirm("Are you sure you wish to permanently delete this calendar?")) {
      setDeleting(true);
      ApiHelper.delete("/curatedCalendars/" + calendar.id.toString(), "ContentApi").then(() => {
        setDeleting(false);
        props.updatedCallback(null);
      }).catch(() => {
        setDeleting(false);
      });
    }
  };

  useEffect(() => { setCalendar(props.calendar); }, [props.calendar]);

  if (!calendar) return <></>

  const isNew = !calendar.id;

  return (
    <Card sx={{
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'grey.200',
      height: 'fit-content'
    }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {isNew ? 'Create Calendar' : 'Edit Calendar'}
            </Typography>
          </Stack>
          <IconButton
            size="small"
            onClick={handleCancel}
            sx={{
              backgroundColor: 'rgba(0,0,0,0.04)',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.08)' }
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </Box>

      <CardContent>
        <Stack spacing={3}>
          {errors.length > 0 && (
            <Alert severity="error" data-testid="calendar-errors">
              <Stack spacing={1}>
                {errors.map((error, index) => (
                  <Typography key={index} variant="body2">{error}</Typography>
                ))}
              </Stack>
            </Alert>
          )}

          <TextField
            fullWidth
            label="Calendar Name"
            name="name"
            value={calendar.name || ''}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            data-testid="calendar-name-input"
            aria-label="Calendar name"
            placeholder="Enter a name for this calendar"
            variant="outlined"
          />

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Calendar Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This calendar will be available for use across your church. You can add events from any group to this curated calendar.
            </Typography>
          </Box>

          <Divider />

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={saving || deleting}
              sx={{
                textTransform: 'none',
                borderRadius: 2
              }}
            >
              Cancel
            </Button>

            {!isNew && (
              <Button
                variant="outlined"
                color="error"
                onClick={handleDelete}
                disabled={saving || deleting}
                startIcon={deleting ? undefined : <DeleteIcon />}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2
                }}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            )}

            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving || deleting || !calendar.name?.trim()}
              startIcon={saving ? undefined : <SaveIcon />}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                fontWeight: 600
              }}
            >
              {saving ? 'Saving...' : (isNew ? 'Create' : 'Save')}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
