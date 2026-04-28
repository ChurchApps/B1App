"use client";

import React from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Icon,
  InputAdornment,
  TextField,
  Typography
} from "@mui/material";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import { mobileTheme } from "../mobileTheme";
import { getInitials } from "../util";

interface Person {
  id: string;
  name: { display?: string };
  photo?: string;
}

interface GroupMember {
  id: string;
  person: Person;
}

interface Props {
  groupId: string;
  members: GroupMember[];
}

interface Session {
  id?: string;
  groupId?: string;
  sessionDate?: string;
}

interface VisitSession {
  id?: string;
  sessionId?: string;
  visit?: { id?: string; personId?: string };
}

interface AttendancePerson {
  id: string;
  name: { display?: string };
  photo?: string;
  isMember: boolean;
}

const toHtmlDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const fromHtmlDate = (s: string) => {
  const [y, m, day] = s.split("-").map(Number);
  return new Date(y, m - 1, day);
};

export const GroupAttendanceTab = ({ groupId, members }: Props) => {
  const tc = mobileTheme.colors;
  const [selectedDate, setSelectedDate] = React.useState<string>(toHtmlDate(new Date()));
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [currentSession, setCurrentSession] = React.useState<Session | null>(null);
  const [attendance, setAttendance] = React.useState<Record<string, boolean>>({});
  const [originalAttendance, setOriginalAttendance] = React.useState<Record<string, boolean>>({});
  const [additional, setAdditional] = React.useState<Person[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const [showSearch, setShowSearch] = React.useState(false);
  const [searchText, setSearchText] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<Person[]>([]);
  const [searching, setSearching] = React.useState(false);

  const allPeople = React.useMemo<AttendancePerson[]>(() => {
    const fromMembers: AttendancePerson[] = members.map((m) => ({
      id: m.person.id,
      name: m.person.name,
      photo: m.person.photo,
      isMember: true
    }));
    const extras: AttendancePerson[] = additional
      .filter((p) => !members.some((m) => m.person.id === p.id))
      .map((p) => ({ id: p.id, name: p.name, photo: p.photo, isMember: false }));
    return [...fromMembers, ...extras];
  }, [members, additional]);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data: Session[] = await ApiHelper.get(`/sessions?groupId=${groupId}`, "AttendanceApi");
        if (!cancelled) setSessions(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setSessions([]);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  React.useEffect(() => {
    let cancelled = false;
    const loadForDate = async () => {
      setLoading(true);
      setMessage(null);
      const existing = sessions.find((s) => {
        if (!s.sessionDate) return false;
        const sd = typeof s.sessionDate === "string" ? s.sessionDate.slice(0, 10) : "";
        return sd === selectedDate;
      });
      if (cancelled) return;
      setCurrentSession(existing || null);

      if (existing?.id) {
        try {
          const visits: VisitSession[] = await ApiHelper.get(
            `/visitsessions?sessionId=${existing.id}`,
            "AttendanceApi"
          );
          const map: Record<string, boolean> = {};
          const personIds: string[] = [];
          visits.forEach((v) => {
            if (v.visit?.personId) {
              map[v.visit.personId] = true;
              personIds.push(v.visit.personId);
            }
          });
          const memberIds = members.map((m) => m.person.id);
          const nonMemberIds = personIds.filter((id) => !memberIds.includes(id));
          if (nonMemberIds.length > 0) {
            try {
              const extras: Person[] = await ApiHelper.get(
                `/people/ids?ids=${nonMemberIds.join(",")}`,
                "MembershipApi"
              );
              if (!cancelled) setAdditional(Array.isArray(extras) ? extras : []);
            } catch {
              if (!cancelled) setAdditional([]);
            }
          } else if (!cancelled) {
            setAdditional([]);
          }
          if (!cancelled) {
            setAttendance(map);
            setOriginalAttendance({ ...map });
          }
        } catch {
          if (!cancelled) {
            setAttendance({});
            setOriginalAttendance({});
            setAdditional([]);
          }
        }
      } else if (!cancelled) {
        setAttendance({});
        setOriginalAttendance({});
        setAdditional([]);
      }
      if (!cancelled) setLoading(false);
    };
    loadForDate();
    return () => {
      cancelled = true;
    };
  }, [selectedDate, sessions, members]);

  const toggle = (personId: string) => {
    setAttendance((prev) => ({ ...prev, [personId]: !prev[personId] }));
  };

  const selectAll = () => {
    const m: Record<string, boolean> = {};
    allPeople.forEach((p) => (m[p.id] = true));
    setAttendance(m);
  };
  const deselectAll = () => setAttendance({});

  const presentCount = Object.values(attendance).filter(Boolean).length;

  const handleSearch = async () => {
    const term = searchText.trim();
    if (!term) return;
    setSearching(true);
    try {
      const data: Person[] = await ApiHelper.get(
        `/people/search/?term=${encodeURIComponent(term)}`,
        "MembershipApi"
      );
      setSearchResults(Array.isArray(data) ? data : []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const addPerson = (p: Person) => {
    const already = additional.some((a) => a.id === p.id) || members.some((m) => m.person.id === p.id);
    if (!already) setAdditional((prev) => [...prev, p]);
    setAttendance((prev) => ({ ...prev, [p.id]: true }));
    setSearchText("");
    setSearchResults([]);
    setShowSearch(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      let sessionId = currentSession?.id;
      if (!sessionId) {
        const payload: Session = { groupId, sessionDate: selectedDate };
        const created = await ApiHelper.post("/sessions", [payload], "AttendanceApi");
        if (created && created.length > 0) {
          sessionId = created[0].id;
          setCurrentSession(created[0]);
          setSessions((prev) => [...prev, created[0]]);
        }
      }
      if (!sessionId) throw new Error("Session creation failed");

      const toAdd: string[] = [];
      const toRemove: string[] = [];
      allPeople.forEach((p) => {
        const now = !!attendance[p.id];
        const was = !!originalAttendance[p.id];
        if (now && !was) toAdd.push(p.id);
        else if (!now && was) toRemove.push(p.id);
      });

      for (const personId of toAdd) {
        await ApiHelper.post(
          "/visitsessions/log",
          { checkinTime: new Date(), personId, visitSessions: [{ sessionId }] },
          "AttendanceApi"
        );
      }
      for (const personId of toRemove) {
        await ApiHelper.delete(`/visitsessions?sessionId=${sessionId}&personId=${personId}`, "AttendanceApi");
      }

      setOriginalAttendance({ ...attendance });
      setMessage({ type: "success", text: Locale.label("mobile.group.attendanceSaved") });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ type: "error", text: Locale.label("mobile.group.failedAttendanceSave") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.md}px` }}>

      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`,
          display: "flex",
          alignItems: "center",
          gap: `${mobileTheme.spacing.sm}px`
        }}
      >
        <Icon sx={{ color: tc.primary }}>calendar_today</Icon>
        <TextField
          type="date"
          size="small"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          inputProps={{ max: toHtmlDate(new Date()) }}
          sx={{ flex: 1 }}
        />
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography sx={{ fontSize: 14, fontWeight: 500, color: tc.textMuted }}>
          {Locale.label("mobile.group.presentOf").replace("{}", String(presentCount)).replace("{}", String(allPeople.length))}
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Button
            size="small"
            onClick={selectAll}
            disabled={loading || saving}
            sx={{ textTransform: "none", color: tc.primary, fontWeight: 600 }}
          >
            {Locale.label("mobile.group.selectAll")}
          </Button>
          <Button
            size="small"
            onClick={deselectAll}
            disabled={loading || saving}
            sx={{ textTransform: "none", color: tc.primary, fontWeight: 600 }}
          >
            {Locale.label("mobile.group.selectNone")}
          </Button>
          <Button
            size="small"
            startIcon={<Icon>person_add</Icon>}
            onClick={() => setShowSearch(!showSearch)}
            disabled={loading || saving}
            sx={{ textTransform: "none", color: tc.primary, fontWeight: 600 }}
          >
            {Locale.label("mobile.group.add")}
          </Button>
        </Box>
      </Box>

      {showSearch && (
        <Box
          sx={{
            bgcolor: tc.surface,
            borderRadius: `${mobileTheme.radius.lg}px`,
            boxShadow: mobileTheme.shadows.sm,
            p: `${mobileTheme.spacing.md}px`,
            display: "flex",
            flexDirection: "column",
            gap: 1
          }}
        >
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              size="small"
              placeholder={Locale.label("mobile.group.searchForPerson")}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Icon>search</Icon>
                  </InputAdornment>
                )
              }}
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={searching || !searchText.trim()}
              sx={{
                bgcolor: tc.primary,
                color: tc.onPrimary,
                textTransform: "none",
                "&:hover": { bgcolor: tc.primary }
              }}
            >
              {searching ? "…" : Locale.label("mobile.group.search")}
            </Button>
          </Box>
          {searchResults.map((r) => {
            const already = allPeople.some((p) => p.id === r.id);
            return (
              <Box
                key={r.id}
                onClick={() => !already && addPerson(r)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  p: "8px",
                  borderRadius: `${mobileTheme.radius.md}px`,
                  cursor: already ? "default" : "pointer",
                  opacity: already ? 0.5 : 1,
                  "&:hover": already ? undefined : { bgcolor: tc.iconBackground }
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "18px",
                    bgcolor: tc.primaryLight,
                    color: tc.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 12
                  }}
                >
                  {getInitials(r)}
                </Box>
                <Typography sx={{ flex: 1, fontSize: 14, color: tc.text }}>
                  {r.name?.display || Locale.label("mobile.components.unknown")}
                </Typography>
                {already ? (
                  <Typography sx={{ fontSize: 12, color: tc.textSecondary }}>{Locale.label("mobile.group.added")}</Typography>
                ) : (
                  <Icon sx={{ color: tc.primary }}>add_circle</Icon>
                )}
              </Box>
            );
          })}
          {searchText && !searching && searchResults.length === 0 && (
            <Typography sx={{ textAlign: "center", color: tc.textMuted, fontSize: 13 }}>
              {Locale.label("mobile.group.noResults")}
            </Typography>
          )}
        </Box>
      )}

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress sx={{ color: tc.primary }} />
        </Box>
      )}
      {!loading && allPeople.length === 0 && (
        <Box
          sx={{
            bgcolor: tc.surface,
            borderRadius: `${mobileTheme.radius.lg}px`,
            p: `${mobileTheme.spacing.lg}px`,
            textAlign: "center"
          }}
        >
          <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
            {Locale.label("mobile.group.noMembersGuests")}
          </Typography>
        </Box>
      )}
      {!loading && allPeople.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {allPeople.map((p) => {
            const present = !!attendance[p.id];
            return (
              <Box
                key={p.id}
                onClick={() => toggle(p.id)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: `${mobileTheme.spacing.md}px`,
                  bgcolor: tc.surface,
                  borderRadius: `${mobileTheme.radius.md}px`,
                  p: `${mobileTheme.spacing.sm}px`,
                  cursor: "pointer",
                  "&:hover": { bgcolor: tc.iconBackground }
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "22px",
                    bgcolor: tc.primaryLight,
                    color: tc.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 14
                  }}
                >
                  {getInitials(p)}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 15, fontWeight: 500, color: tc.text }}>
                    {p.name?.display || Locale.label("mobile.components.unknown")}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: present ? tc.success : tc.textHint }}>
                    {present ? Locale.label("mobile.group.present") : Locale.label("mobile.group.absent")}
                    {!p.isMember && " " + Locale.label("mobile.group.guest")}
                  </Typography>
                </Box>
                <Checkbox checked={present} sx={{ color: tc.primary, "&.Mui-checked": { color: tc.primary } }} />
              </Box>
            );
          })}
        </Box>
      )}

      {message && (
        <Box
          sx={{
            bgcolor: message.type === "success" ? "rgba(112,220,135,0.15)" : "rgba(176,18,12,0.15)",
            color: message.type === "success" ? tc.success : tc.error,
            borderRadius: `${mobileTheme.radius.md}px`,
            p: `${mobileTheme.spacing.sm}px`,
            textAlign: "center",
            fontSize: 14
          }}
        >
          {message.text}
        </Box>
      )}

      <Button
        variant="contained"
        onClick={handleSave}
        disabled={loading || saving}
        sx={{
          bgcolor: tc.primary,
          color: tc.onPrimary,
          textTransform: "none",
          fontWeight: 600,
          borderRadius: `${mobileTheme.radius.md}px`,
          py: "10px",
          "&:hover": { bgcolor: tc.primary }
        }}
      >
        {saving ? Locale.label("mobile.group.saving") : Locale.label("mobile.group.saveAttendance")}
      </Button>
    </Box>
  );
};

export default GroupAttendanceTab;
