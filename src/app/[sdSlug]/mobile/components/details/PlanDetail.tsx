"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Icon,
  IconButton,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LinkIcon from "@mui/icons-material/Link";
import { ApiHelper, ArrayHelper } from "@churchapps/apphelper";
import type {
  AssignmentInterface,
  PersonInterface,
  PlanInterface,
  PlanItemInterface,
  PositionInterface,
  TimeInterface,
} from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import UserContext from "@/context/UserContext";
import { mobileTheme } from "../mobileTheme";

interface Props {
  id: string;
  config: ConfigurationInterface;
}

interface SongRow {
  id?: string;
  label: string;
  description?: string;
  seconds?: number;
  link?: string;
  key?: string;
  arrangement?: string;
}

const formatDuration = (seconds?: number) => {
  if (!seconds || seconds <= 0) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const formatServiceDate = (date?: Date | string) => {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

const flattenSongs = (items: PlanItemInterface[]): SongRow[] => {
  const songs: SongRow[] = [];
  const walk = (arr: PlanItemInterface[]) => {
    arr.forEach((pi) => {
      if (pi.itemType === "song") {
        const extras = pi as unknown as Record<string, any>;
        songs.push({
          id: pi.id,
          label: pi.label || "Untitled Song",
          description: pi.description,
          seconds: pi.seconds,
          link: pi.link || extras.link,
          key: extras.key || extras.songKey,
          arrangement: extras.arrangement,
        });
      }
      if (pi.children?.length) walk(pi.children);
    });
  };
  walk(items);
  return songs;
};

export const PlanDetail = ({ id, config: _config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const userContext = useContext(UserContext);

  const [plan, setPlan] = useState<PlanInterface | null>(null);
  const [planItems, setPlanItems] = useState<PlanItemInterface[]>([]);
  const [positions, setPositions] = useState<PositionInterface[]>([]);
  const [assignments, setAssignments] = useState<AssignmentInterface[]>([]);
  const [people, setPeople] = useState<PersonInterface[]>([]);
  const [times, setTimes] = useState<TimeInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<"order" | "team" | "songs">("order");

  const isLoggedIn = !!userContext?.userChurch?.jwt;

  useEffect(() => {
    if (!id) return;
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        // Plan + items + positions + assignments can run in parallel
        const [planRes, itemsRes, positionsRes, assignmentsRes, timesRes] = await Promise.all([
          ApiHelper.get(`/plans/${id}`, "DoingApi").catch((): null => null),
          ApiHelper.get(`/planItems/plan/${id}`, "DoingApi").catch((): any[] => []),
          ApiHelper.get(`/positions/plan/${id}`, "DoingApi").catch((): any[] => []),
          ApiHelper.get(`/assignments/plan/${id}`, "DoingApi").catch((): any[] => []),
          // TODO: verify — PlanClient uses `/times/plan/{id}`; PlansPage list uses `/times/plans?planIds=`.
          ApiHelper.get(`/times/plan/${id}`, "DoingApi").catch((): any[] => []),
        ]);

        if (cancelled) return;

        if (!planRes || !planRes.id) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setPlan(planRes);
        setPlanItems(Array.isArray(itemsRes) ? itemsRes : []);
        setPositions(Array.isArray(positionsRes) ? positionsRes : []);
        setAssignments(Array.isArray(assignmentsRes) ? assignmentsRes : []);
        setTimes(Array.isArray(timesRes) ? timesRes : []);

        const peopleIds = ArrayHelper.getIds(
          Array.isArray(assignmentsRes) ? assignmentsRes : [],
          "personId"
        );
        if (peopleIds.length > 0) {
          try {
            const peopleRes = await ApiHelper.get(
              `/people/basic?ids=${encodeURIComponent(peopleIds.join(","))}`,
              "MembershipApi"
            );
            if (!cancelled) setPeople(Array.isArray(peopleRes) ? peopleRes : []);
          } catch {
            if (!cancelled) setPeople([]);
          }
        } else {
          setPeople([]);
        }
      } catch (err) {
        console.error("Failed to load plan", err);
        if (!cancelled) {
          setNotFound(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, isLoggedIn]);

  const songs = useMemo(() => flattenSongs(planItems), [planItems]);

  const teamGroups = useMemo(() => {
    const groups: { category: string; positions: PositionInterface[] }[] = [];
    const categories = ArrayHelper.getUniqueValues(positions, "categoryName");
    categories.forEach((category: string) => {
      groups.push({
        category: category || "Team",
        positions: ArrayHelper.getAll(positions, "categoryName", category),
      });
    });
    return groups;
  }, [positions]);

  const BackButton = (
    <IconButton
      onClick={() => router.push("/mobile/plans")}
      aria-label="Back"
      sx={{
        color: tc.primary,
        bgcolor: tc.surface,
        width: 40,
        height: 40,
        boxShadow: mobileTheme.shadows.sm,
        "&:hover": { bgcolor: tc.surfaceVariant },
      }}
    >
      <ArrowBackIcon sx={{ fontSize: 24 }} />
    </IconButton>
  );

  const OuterShell = ({ children }: { children: React.ReactNode }) => (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      <Box sx={{ mb: `${mobileTheme.spacing.md}px` }}>{BackButton}</Box>
      {children}
    </Box>
  );

  if (!isLoggedIn) {
    return (
      <OuterShell>
        <Box
          sx={{
            bgcolor: tc.surface,
            borderRadius: `${mobileTheme.radius.lg}px`,
            boxShadow: mobileTheme.shadows.sm,
            p: `${mobileTheme.spacing.lg}px`,
            textAlign: "center",
            mt: 4,
          }}
        >
          <Icon sx={{ fontSize: 56, color: tc.textSecondary, mb: 1 }}>lock</Icon>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: 1 }}>
            Sign in required
          </Typography>
          <Typography sx={{ fontSize: 14, color: tc.textMuted, mb: 2 }}>
            Please sign in to view your plan details.
          </Typography>
          <Link
            href={`/login/?returnUrl=/mobile/plans/${id}`}
            style={{ color: tc.primary, fontWeight: 600, textDecoration: "none" }}
          >
            Sign In
          </Link>
        </Box>
      </OuterShell>
    );
  }

  if (loading) {
    return (
      <OuterShell>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
          <CircularProgress sx={{ color: tc.primary }} />
        </Box>
      </OuterShell>
    );
  }

  if (notFound || !plan) {
    return (
      <OuterShell>
        <Box
          sx={{
            bgcolor: tc.surface,
            borderRadius: `${mobileTheme.radius.lg}px`,
            boxShadow: mobileTheme.shadows.sm,
            p: `${mobileTheme.spacing.lg}px`,
            textAlign: "center",
            mt: 4,
          }}
        >
          <Icon sx={{ fontSize: 56, color: tc.textSecondary, mb: 1 }}>event_busy</Icon>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: 1 }}>
            Plan not available
          </Typography>
          <Typography sx={{ fontSize: 14, color: tc.textMuted, mb: 2 }}>
            This plan may have been removed or you may not have access.
          </Typography>
          <Link href="/mobile/plans" style={{ color: tc.primary, fontWeight: 600, textDecoration: "none" }}>
            Back to Plans
          </Link>
        </Box>
      </OuterShell>
    );
  }

  const headerCard = (
    <Box
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.lg}px`,
        boxShadow: mobileTheme.shadows.md,
        p: `${mobileTheme.spacing.md}px`,
        mb: `${mobileTheme.spacing.md}px`,
        background: `linear-gradient(135deg, ${tc.primary} 0%, ${tc.secondary} 100%)`,
        color: tc.onPrimary,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Icon sx={{ color: "#FFFFFF" }}>assignment</Icon>
        <Typography sx={{ fontSize: 12, color: "#FFFFFF", opacity: 0.85, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
          Service Plan
        </Typography>
      </Box>
      <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF", lineHeight: 1.25 }}>
        {plan.name}
      </Typography>
      {plan.serviceDate ? (
        <Typography sx={{ fontSize: 14, color: "#FFFFFF", opacity: 0.9, mt: 0.5 }}>
          {formatServiceDate(plan.serviceDate)}
        </Typography>
      ) : null}
      {times.length > 0 ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1.5 }}>
          {times.slice(0, 4).map((t) => {
            const teamLabel = t.teamList && t.teamList.length ? t.teamList.join(", ") : t.teams || "";
            return (
              <Chip
                key={t.id}
                label={t.displayName || teamLabel || "Time"}
                size="small"
                sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#FFFFFF", fontWeight: 500 }}
              />
            );
          })}
        </Box>
      ) : null}
    </Box>
  );

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      <Box sx={{ mb: `${mobileTheme.spacing.md}px` }}>{BackButton}</Box>
      {headerCard}

      {/* Tabs */}
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          mb: `${mobileTheme.spacing.md}px`,
          overflow: "hidden",
        }}
      >
        <Tabs
          value={tab}
          onChange={(_e, v) => setTab(v)}
          variant="fullWidth"
          TabIndicatorProps={{ sx: { backgroundColor: tc.primary, height: 3, borderRadius: "3px 3px 0 0" } }}
          sx={{
            minHeight: 48,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: 14,
              color: tc.textSecondary,
              minHeight: 48,
            },
            "& .Mui-selected": { color: `${tc.primary} !important` },
          }}
        >
          <Tab value="order" label="Order of Service" />
          <Tab value="team" label="Team" />
          <Tab value="songs" label="Songs" />
        </Tabs>
      </Box>

      {tab === "order" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
          {planItems.length === 0 ? (
            <Box
              sx={{
                bgcolor: tc.surface,
                borderRadius: `${mobileTheme.radius.lg}px`,
                boxShadow: mobileTheme.shadows.sm,
                p: `${mobileTheme.spacing.lg}px`,
                textAlign: "center",
              }}
            >
              <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
                No items in the order of service.
              </Typography>
            </Box>
          ) : (
            planItems.map((pi) => <OrderItemCard key={pi.id} item={pi} />)
          )}
        </Box>
      )}

      {tab === "team" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.md}px` }}>
          {teamGroups.length === 0 ? (
            <Box
              sx={{
                bgcolor: tc.surface,
                borderRadius: `${mobileTheme.radius.lg}px`,
                boxShadow: mobileTheme.shadows.sm,
                p: `${mobileTheme.spacing.lg}px`,
                textAlign: "center",
              }}
            >
              <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
                No teams assigned yet.
              </Typography>
            </Box>
          ) : (
            teamGroups.map((group) => (
              <TeamGroupCard
                key={group.category}
                category={group.category}
                positions={group.positions}
                assignments={assignments}
                people={people}
              />
            ))
          )}
        </Box>
      )}

      {tab === "songs" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
          {songs.length === 0 ? (
            <Box
              sx={{
                bgcolor: tc.surface,
                borderRadius: `${mobileTheme.radius.lg}px`,
                boxShadow: mobileTheme.shadows.sm,
                p: `${mobileTheme.spacing.lg}px`,
                textAlign: "center",
              }}
            >
              <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
                No songs scheduled.
              </Typography>
            </Box>
          ) : (
            songs.map((song, i) => <SongCard key={song.id || `${song.label}-${i}`} song={song} />)
          )}
        </Box>
      )}
    </Box>
  );
};

/* ---------- Subcomponents ---------- */

const OrderItemCard = ({ item }: { item: PlanItemInterface }) => {
  const tc = mobileTheme.colors;
  const isHeader = item.itemType === "header";
  const duration = formatDuration(item.seconds);

  return (
    <Box
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.lg}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.md}px`,
        borderLeft: isHeader ? `4px solid ${tc.primary}` : "none",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography
          sx={{
            flex: 1,
            fontSize: isHeader ? 16 : 15,
            fontWeight: isHeader ? 700 : 500,
            color: tc.text,
            textTransform: isHeader ? "uppercase" : "none",
            letterSpacing: isHeader ? 0.5 : 0,
          }}
        >
          {item.label || "(untitled)"}
        </Typography>
        {duration ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: tc.textMuted }}>
            <Icon sx={{ fontSize: 14 }}>schedule</Icon>
            <Typography sx={{ fontSize: 12, fontWeight: 500 }}>{duration}</Typography>
          </Box>
        ) : null}
      </Box>
      {item.description ? (
        <Typography sx={{ mt: 1, fontSize: 13, color: tc.textMuted, whiteSpace: "pre-wrap" }}>
          {item.description}
        </Typography>
      ) : null}
      {item.children && item.children.length > 0 ? (
        <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 1, pl: 1.5, borderLeft: `2px solid ${tc.border}` }}>
          {item.children.map((child) => (
            <Box key={child.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Icon sx={{ fontSize: 14, color: tc.textSecondary }}>
                {child.itemType === "song" ? "music_note" : "chevron_right"}
              </Icon>
              <Typography sx={{ flex: 1, fontSize: 14, color: tc.text }}>
                {child.label || "(untitled)"}
              </Typography>
              {formatDuration(child.seconds) ? (
                <Typography sx={{ fontSize: 12, color: tc.textMuted }}>
                  {formatDuration(child.seconds)}
                </Typography>
              ) : null}
            </Box>
          ))}
        </Box>
      ) : null}
    </Box>
  );
};

const TeamGroupCard = ({
  category,
  positions,
  assignments,
  people,
}: {
  category: string;
  positions: PositionInterface[];
  assignments: AssignmentInterface[];
  people: PersonInterface[];
}) => {
  const tc = mobileTheme.colors;

  const statusColor = (status?: string) => {
    if (status === "Accepted") return tc.success;
    if (status === "Declined") return tc.error;
    return tc.warning;
  };

  return (
    <Box
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.lg}px`,
        boxShadow: mobileTheme.shadows.sm,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: `${mobileTheme.spacing.md}px`,
          py: `${mobileTheme.spacing.sm}px`,
          bgcolor: tc.primaryLight,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Icon sx={{ color: tc.primary, fontSize: 20 }}>groups</Icon>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: tc.primary }}>{category}</Typography>
      </Box>

      <Box>
        {positions.map((pos) => {
          const posAssignments = ArrayHelper.getAll(assignments, "positionId", pos.id);
          return (
            <Box key={pos.id} sx={{ px: `${mobileTheme.spacing.md}px`, py: `${mobileTheme.spacing.sm}px`, borderTop: `1px solid ${tc.border}` }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: tc.textSecondary, mb: 0.5 }}>
                {pos.name} {pos.count && pos.count > 1 ? `(${posAssignments.length}/${pos.count})` : ""}
              </Typography>
              {posAssignments.length === 0 ? (
                <Typography sx={{ fontSize: 13, color: tc.textMuted, fontStyle: "italic" }}>
                  Unassigned
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  {posAssignments.map((a) => {
                    const person = ArrayHelper.getOne(people, "id", a.personId);
                    const displayName =
                      person?.name?.display ||
                      [person?.name?.first, person?.name?.last].filter(Boolean).join(" ") ||
                      "Unknown";
                    const photo = person?.photo;
                    return (
                      <Box key={a.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Avatar
                          src={photo || undefined}
                          sx={{ width: 28, height: 28, fontSize: 12, bgcolor: tc.primaryLight, color: tc.primary }}
                        >
                          {displayName[0]?.toUpperCase() || "?"}
                        </Avatar>
                        <Typography sx={{ flex: 1, fontSize: 14, color: tc.text }}>{displayName}</Typography>
                        {a.status ? (
                          <Box
                            sx={{
                              px: 1,
                              py: 0.25,
                              borderRadius: "999px",
                              bgcolor: `${statusColor(a.status)}1A`,
                              color: statusColor(a.status),
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            {a.status}
                          </Box>
                        ) : null}
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

const SongCard = ({ song }: { song: SongRow }) => {
  const tc = mobileTheme.colors;
  const openLink = () => {
    if (song.link) window.open(song.link, "_blank", "noopener,noreferrer");
  };
  return (
    <Box
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.lg}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.md}px`,
        display: "flex",
        alignItems: "center",
        gap: `${mobileTheme.spacing.md}px`,
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: `${mobileTheme.radius.md}px`,
          bgcolor: tc.primaryLight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon sx={{ color: tc.primary }}>music_note</Icon>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: 15,
            fontWeight: 600,
            color: tc.text,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {song.label}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.25, flexWrap: "wrap" }}>
          {song.arrangement ? (
            <Typography sx={{ fontSize: 12, color: tc.textSecondary }}>{song.arrangement}</Typography>
          ) : null}
          {song.key ? (
            <Box
              sx={{
                px: 0.75,
                py: 0.1,
                borderRadius: `${mobileTheme.radius.sm}px`,
                bgcolor: tc.iconBackground,
                color: tc.text,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Key: {song.key}
            </Box>
          ) : null}
          {formatDuration(song.seconds) ? (
            <Typography sx={{ fontSize: 12, color: tc.textMuted, display: "inline-flex", alignItems: "center", gap: 0.25 }}>
              <Icon sx={{ fontSize: 12 }}>schedule</Icon>
              {formatDuration(song.seconds)}
            </Typography>
          ) : null}
        </Box>
      </Box>
      {song.link ? (
        <IconButton
          aria-label="Open song link"
          onClick={openLink}
          sx={{ color: tc.primary }}
        >
          <LinkIcon />
        </IconButton>
      ) : null}
    </Box>
  );
};

export default PlanDetail;
