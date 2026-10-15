"use client";

import React from "react";
import { Box, Button, CircularProgress, InputAdornment, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/AddCircleOutline";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import SearchIcon from "@mui/icons-material/Search";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import { MarkdownEditor } from "@churchapps/apphelper/markdown";
import { mobileTheme } from "../mobileTheme";
import { PersonAvatar, PlateSection, QuietEmpty, Row, RowList, StatusBadge, TextLink } from "../kit";

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
  initialDate?: string;
  onSaved?: () => void;
}

interface Session {
  id?: string;
  groupId?: string;
  serviceTimeId?: string;
  sessionDate?: string;
  notes?: string;
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

export const GroupAttendanceTab = ({ groupId, members, initialDate, onSaved }: Props) => {
  const tc = mobileTheme.colors;
  const [selectedDate, setSelectedDate] = React.useState<string>(initialDate || toHtmlDate(new Date()));
  const [notes, setNotes] = React.useState("");
  // An unmounting MarkdownEditor fires one last onChange with its old content; drop it while a date loads.
  const acceptNotes = React.useRef(false);
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

  const memberIdsKey = members.map((m) => m.person.id).join(",");

  React.useEffect(() => {
    let cancelled = false;
    const loadForDate = async () => {
      acceptNotes.current = false;
      setLoading(true);
      const existing = sessions.find((s) => {
        if (!s.sessionDate) return false;
        const sd = typeof s.sessionDate === "string" ? s.sessionDate.slice(0, 10) : "";
        return sd === selectedDate;
      });
      if (cancelled) return;
      setCurrentSession(existing || null);
      setNotes(existing?.notes || "");

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
          const memberIds = memberIdsKey.split(",");
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
      if (!cancelled) {
        acceptNotes.current = true;
        setLoading(false);
      }
    };
    loadForDate();
    return () => {
      cancelled = true;
    };
  }, [selectedDate, sessions, memberIdsKey]);

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
    let savedSession: Session | null = null;
    try {
      let sessionId = currentSession?.id;
      if (!sessionId) {
        const payload: Session = { groupId, sessionDate: selectedDate, notes };
        const created = await ApiHelper.post("/sessions", [payload], "AttendanceApi");
        if (created && created.length > 0) {
          sessionId = created[0].id;
          savedSession = { ...created[0], sessionDate: selectedDate, notes };
          setCurrentSession(savedSession);
        }
      } else if (notes !== (currentSession?.notes || "")) {
        await ApiHelper.post("/sessions", [{ id: sessionId, groupId, serviceTimeId: currentSession?.serviceTimeId, sessionDate: selectedDate, notes }], "AttendanceApi");
        savedSession = { ...currentSession, notes };
        setCurrentSession(savedSession);
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
        setOriginalAttendance((prev) => ({ ...prev, [personId]: true }));
      }
      for (const personId of toRemove) {
        await ApiHelper.delete(`/visitsessions?sessionId=${sessionId}&personId=${personId}`, "AttendanceApi");
        setOriginalAttendance((prev) => ({ ...prev, [personId]: false }));
      }

      setMessage({ type: "success", text: Locale.label("mobile.group.attendanceSaved") });
      onSaved?.();
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ type: "error", text: Locale.label("mobile.group.failedAttendanceSave") });
    } finally {
      setSaving(false);
      // Deferred: changing sessions re-runs the load effect, which would reset attendance mid-save.
      if (savedSession) setSessions((prev) => [...prev.filter((s) => s.id !== savedSession!.id), savedSession!]);
    }
  };

  return (
    <>
      <PlateSection>
        <TextField
          type="date"
          label={Locale.label("common.date")}
          value={selectedDate}
          onChange={(e) => { setSelectedDate(e.target.value); setMessage(null); }}
          slotProps={{ htmlInput: { max: toHtmlDate(new Date()) }, inputLabel: { shrink: true } }}
          sx={{ minWidth: 200 }}
        />
        <Box sx={{ mt: "16px" }} data-testid="attendance-notes">
          {!loading && <MarkdownEditor key={selectedDate} value={notes} onChange={(v) => { if (acceptNotes.current) setNotes(v); }} placeholder={Locale.label("mobile.group.notes")} style={{ maxHeight: 240, overflowY: "auto" }} />}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", mt: "14px" }}>
          <Typography sx={{ fontSize: 15, color: tc.textSecondary }}>
            {Locale.label("mobile.group.presentOf").replace("{}", String(presentCount)).replace("{}", String(allPeople.length))}
          </Typography>
          <Box sx={{ display: "flex", gap: "16px" }}>
            <TextLink onClick={selectAll} disabled={loading || saving}>{Locale.label("mobile.group.selectAll")}</TextLink>
            <TextLink onClick={deselectAll} disabled={loading || saving}>{Locale.label("mobile.group.selectNone")}</TextLink>
            <TextLink onClick={() => setShowSearch(!showSearch)} disabled={loading || saving}>{Locale.label("mobile.group.add")}</TextLink>
          </Box>
        </Box>

        {showSearch && (
          <Box sx={{ mt: "12px" }}>
            <Box sx={{ display: "flex", gap: "8px" }}>
              <TextField
                size="small"
                placeholder={Locale.label("mobile.group.searchForPerson")}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: tc.textSecondary }} /></InputAdornment> } }}
                sx={{ flex: 1 }}
              />
              <Button variant="outlined" onClick={handleSearch} disabled={searching || !searchText.trim()}>
                {searching ? "…" : Locale.label("mobile.group.search")}
              </Button>
            </Box>
            <RowList>
              {searchResults.map((r) => {
                const already = allPeople.some((p) => p.id === r.id);
                return (
                  <Row
                    key={r.id}
                    onClick={already ? undefined : () => addPerson(r)}
                    leading={<PersonAvatar name={r.name?.display} size={36} />}
                    title={r.name?.display || Locale.label("mobile.components.unknown")}
                    trailing={already ? <StatusBadge>{Locale.label("mobile.group.added")}</StatusBadge> : <AddIcon sx={{ color: tc.link }} />}
                  />
                );
              })}
            </RowList>
            {searchText && !searching && searchResults.length === 0 && <QuietEmpty sx={{ mt: "8px" }}>{Locale.label("mobile.group.noResults")}</QuietEmpty>}
          </Box>
        )}
      </PlateSection>

      <PlateSection>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} sx={{ color: tc.primary }} />
          </Box>
        )}
        {!loading && allPeople.length === 0 && <QuietEmpty>{Locale.label("mobile.group.noMembersGuests")}</QuietEmpty>}
        {!loading && allPeople.length > 0 && (
          <RowList>
            {allPeople.map((p) => {
              const present = !!attendance[p.id];
              return (
                <Row
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  aria-pressed={present}
                  leading={<PersonAvatar name={p.name?.display} />}
                  title={p.name?.display || Locale.label("mobile.components.unknown")}
                  subtitle={(present ? Locale.label("mobile.group.present") : Locale.label("mobile.group.absent")) + (!p.isMember ? " " + Locale.label("mobile.group.guest") : "")}
                  trailing={present ? <CheckBoxIcon sx={{ color: tc.primary }} /> : <CheckBoxOutlineBlankIcon sx={{ color: tc.control }} />}
                />
              );
            })}
          </RowList>
        )}
      </PlateSection>

      <PlateSection>
        <Box sx={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <Button variant="contained" onClick={handleSave} disabled={loading || saving}>
            {saving ? Locale.label("mobile.group.saving") : Locale.label("mobile.group.saveAttendance")}
          </Button>
          {message && <StatusBadge tone={message.type === "success" ? "ok" : "bad"}>{message.text}</StatusBadge>}
        </Box>
      </PlateSection>
    </>
  );
};

export default GroupAttendanceTab;
