"use client";

import React, { useState, useEffect } from "react";
import { Loading } from "@churchapps/apphelper";
import { ApiHelper } from "@churchapps/apphelper";
import type { CuratedCalendarInterface } from "@churchapps/helpers";
import { redirect } from "next/navigation";
import {
  Box,
  Typography,
  Stack,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TableContainer,
  Paper,
  Tooltip
} from "@mui/material";
import {
  CalendarMonth as CalendarIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Event as EventIcon,
  Description as DescriptionIcon
} from "@mui/icons-material";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { CalendarEdit } from "@/components/admin/calendar/CalendarEdit";
import { WrapperPageProps } from "@/helpers";

export function CalendarsClientWrapper(props: WrapperPageProps) {
  const [calendars, setCalendars] = useState<CuratedCalendarInterface[]>(null);
  const [currentCalendar, setCurrentCalendar] = useState<CuratedCalendarInterface>(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    ApiHelper.get("/curatedCalendars", "ContentApi").then((data: any) => {
      setCalendars(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  };

  const getRows = () => {
    if (!calendars || calendars.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={3} sx={{ textAlign: 'center', py: 6 }}>
            <Stack spacing={2} alignItems="center">
              <CalendarIcon sx={{ fontSize: 64, color: 'grey.400' }} />
              <Typography variant="h6" color="text.secondary">
                No calendars found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create your first curated calendar to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCurrentCalendar({})}
                sx={{ mt: 2 }}
              >
                Create Calendar
              </Button>
            </Stack>
          </TableCell>
        </TableRow>
      );
    }

    return calendars.map((calendar) => (
      <TableRow
        key={calendar.id}
        sx={{
          '&:hover': {
            backgroundColor: 'action.hover',
            cursor: 'pointer'
          },
          transition: 'background-color 0.2s ease'
        }}
        onClick={() => redirect("/admin/calendars/" + calendar.id)}
      >
        <TableCell>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                backgroundColor: 'primary.main',
                color: 'white',
                borderRadius: 1,
                p: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 40,
                height: 40
              }}
            >
              <CalendarIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {calendar.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Curated Calendar
              </Typography>
            </Box>
          </Stack>
        </TableCell>
        <TableCell>
          <Chip
            icon={<EventIcon />}
            label="Active"
            size="small"
            sx={{
              backgroundColor: '#e8f5e9',
              color: '#2e7d32',
              fontWeight: 600
            }}
          />
        </TableCell>
        <TableCell align="right">
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Tooltip title="Manage Events" arrow>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  redirect("/admin/calendars/" + calendar.id);
                }}
                sx={{
                  color: 'var(--c1)',
                  backgroundColor: 'var(--c1l7)',
                  '&:hover': {
                    backgroundColor: 'var(--c1l6)',
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.2s ease'
                }}
                data-testid={`manage-calendar-${calendar.id}`}
              >
                <EventIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit" arrow>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentCalendar(calendar);
                }}
                sx={{
                  color: 'var(--c1)',
                  backgroundColor: 'var(--c1l7)',
                  '&:hover': {
                    backgroundColor: 'var(--c1l6)',
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.2s ease'
                }}
                data-testid={`edit-calendar-${calendar.id}`}
              >
                <EditIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </TableCell>
      </TableRow>
    ));
  };

  const getTable = () => {
    if (loading) return <Loading data-testid="calendars-loading" />;

    return (
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Table>
          <TableHead sx={{ backgroundColor: 'grey.50' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, borderBottom: '2px solid', borderBottomColor: 'divider' }}>
                Calendar
              </TableCell>
              <TableCell sx={{ fontWeight: 600, borderBottom: '2px solid', borderBottomColor: 'divider' }}>
                Status
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, borderBottom: '2px solid', borderBottomColor: 'divider' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {getRows()}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const getCalendarCount = () => {
    if (loading) return 0;
    return calendars?.length || 0;
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AdminWrapper config={props.config}>
      {/* Page Header */}
      <Box sx={{ backgroundColor: "var(--c1l2)", color: "#FFF", padding: "24px" }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 2, md: 4 }}
          alignItems={{ xs: "flex-start", md: "center" }}
          sx={{ width: "100%" }}
        >
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
            <Box
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '12px',
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CalendarIcon sx={{ fontSize: 32, color: '#FFF' }} />
            </Box>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 600,
                  mb: 0.5,
                  fontSize: { xs: '1.75rem', md: '2.125rem' }
                }}
              >
                Curated Calendars
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: { xs: '0.875rem', md: '1rem' }
                }}
              >
                Manage shared calendars for your church
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <CalendarIcon sx={{ color: "#FFF", fontSize: 20 }} />
              <Typography variant="h6" sx={{ color: "#FFF", fontWeight: 600, mr: 1 }}>
                {getCalendarCount()}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem' }}>
                Calendars
              </Typography>
            </Stack>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setCurrentCalendar({})}
              sx={{
                color: '#FFF',
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': {
                  borderColor: '#FFF',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
              data-testid="add-calendar"
            >
              Create Calendar
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Main Content */}
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: currentCalendar ? 8 : 12 }}>
            <Card sx={{
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'grey.200'
            }}>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CalendarIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      All Calendars
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
              <Box>
                {getTable()}
              </Box>
            </Card>
          </Grid>
          {currentCalendar && (
            <Grid size={{ xs: 12, md: 4 }}>
              <CalendarEdit
                calendar={currentCalendar}
                updatedCallback={() => {
                  setCurrentCalendar(null);
                  loadData();
                }}
              />
            </Grid>
          )}
        </Grid>

        {/* Information Section */}
        <Card sx={{ mt: 3, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
              <Box
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'white',
                  borderRadius: '12px',
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <DescriptionIcon sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
                  About Curated Calendars
                </Typography>
                <Stack spacing={2}>
                  <Typography variant="body1" color="text.secondary">
                    Each group has its own calendar which can be managed by group leaders from the group page. However, you can
                    also create curated calendars which can be shared with the entire church.
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    For example, you might want to create a calendar for all of the church's small groups, or a calendar for all of
                    the church's youth events. You may also wish to create a whole church events calendar which highlights the
                    bigger events without including minor events from each group.
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    You can create as many curated calendars as you like, and you can add events from any group to any curated
                    calendar.
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </AdminWrapper>
  );
}
