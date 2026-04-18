"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Box, Icon, IconButton, Skeleton, Typography } from "@mui/material";
import { ApiHelper, PersonHelper, UserHelper } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import type { PersonInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import UserContext from "@/context/UserContext";
import { mobileTheme } from "../mobileTheme";

interface Props {
  config?: ConfigurationInterface;
}

// Shape the UI renders. We hydrate this from the private messages API.
interface Conversation {
  id: string;
  personId: string;
  personName: string;
  personPhoto?: string;
  lastMessage?: string;
  timestamp?: string | number | Date;
  unread?: boolean;
}

// TODO: Verify messaging endpoints. Currently using:
//   - GET /privateMessages (MessagingApi) - returns ConversationCheckInterface[]
//   - GET /people/basic?ids=... (MembershipApi) - returns PersonInterface[]
// Last-message / timestamp / unread fields may require a different endpoint
// (e.g. /messages/conversation/{conversationId} or a conversation summary endpoint).

export const MessagesPage = ({ config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const userContext = React.useContext(UserContext);
  const loggedIn = !!UserHelper.user?.firstName;
  const myPersonId = userContext?.person?.id;

  const { data: conversations = null } = useQuery<Conversation[]>({
    queryKey: ["conversations", myPersonId],
    queryFn: async () => {
      const pmData: any[] = await ApiHelper.get("/privateMessages", "MessagingApi");
      if (!Array.isArray(pmData) || pmData.length === 0) return [];

      const rows = pmData.map((pm) => {
        const otherId = myPersonId && pm.fromPersonId === myPersonId ? pm.toPersonId : pm.fromPersonId;
        return { pm, otherId };
      });

      const otherIds = Array.from(new Set(rows.map((r) => r.otherId).filter(Boolean)));
      let peopleById: Record<string, PersonInterface> = {};
      if (otherIds.length > 0) {
        const people: PersonInterface[] = await ApiHelper.get(
          `/people/basic?ids=${otherIds.join(",")}`,
          "MembershipApi"
        );
        if (Array.isArray(people)) {
          peopleById = people.reduce((acc, p) => {
            if (p.id) acc[p.id] = p;
            return acc;
          }, {} as Record<string, PersonInterface>);
        }
      }

      return rows.map(({ pm, otherId }) => {
        const person = peopleById[otherId];
        const displayName = person?.name?.display || "Unknown";
        let photo = "";
        if (person) {
          try {
            photo = PersonHelper.getPhotoUrl(person) || "";
          } catch {
            photo = (person as any).photo || "";
          }
        }
        return {
          id: pm.conversationId || pm.id,
          personId: otherId,
          personName: displayName,
          personPhoto: photo,
          lastMessage: pm.lastMessage || pm.content,
          timestamp: pm.timeSent || pm.timeUpdated || pm.lastMessageTime,
          unread: !!pm.unread,
        };
      });
    },
    enabled: loggedIn,
  });

  const formatTimestamp = (ts?: string | number | Date): string => {
    if (!ts) return "";
    const d = new Date(ts);
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    if (sameDay) {
      return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    }
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return d.toLocaleDateString(undefined, { weekday: "short" });
    }
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.charAt(0) || "";
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
    return (first + last).toUpperCase() || "?";
  };

  const renderAvatar = (c: Conversation) => {
    const common = {
      width: 44,
      height: 44,
      borderRadius: "22px",
      flexShrink: 0,
      overflow: "hidden",
    } as const;
    if (c.personPhoto) {
      return (
        <Box
          component="img"
          src={c.personPhoto}
          alt={c.personName}
          sx={{ ...common, objectFit: "cover" }}
        />
      );
    }
    return (
      <Box
        sx={{
          ...common,
          bgcolor: tc.primaryLight,
          color: tc.primary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 14,
        }}
      >
        {getInitials(c.personName)}
      </Box>
    );
  };

  const handleClick = (c: Conversation) => {
    router.push(`/mobile/messages/${c.personId}`);
  };

  const renderRow = (c: Conversation) => (
    <Box
      key={c.id}
      onClick={() => handleClick(c)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick(c);
        }
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: `${mobileTheme.spacing.md}px`,
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.lg}px`,
        boxShadow: mobileTheme.shadows.sm,
        px: `${mobileTheme.spacing.md}px`,
        py: "12px",
        cursor: "pointer",
        transition: "box-shadow 150ms ease, transform 150ms ease",
        "&:hover": { boxShadow: mobileTheme.shadows.md },
        "&:active": { transform: "scale(0.995)" },
      }}
    >
      {renderAvatar(c)}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: 16,
            fontWeight: 600,
            color: tc.text,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {c.personName}
        </Typography>
        {c.lastMessage && (
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 400,
              color: tc.textSecondary,
              mt: "2px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {c.lastMessage}
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "4px",
          flexShrink: 0,
          minWidth: 40,
        }}
      >
        {c.timestamp && (
          <Typography sx={{ fontSize: 12, fontWeight: 400, color: tc.textSecondary }}>
            {formatTimestamp(c.timestamp)}
          </Typography>
        )}
        {c.unread && (
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "4px",
              bgcolor: tc.primary,
            }}
          />
        )}
      </Box>
    </Box>
  );

  const renderSkeleton = (key: number) => (
    <Box
      key={`skeleton-${key}`}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: `${mobileTheme.spacing.md}px`,
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.lg}px`,
        boxShadow: mobileTheme.shadows.sm,
        px: `${mobileTheme.spacing.md}px`,
        py: "12px",
      }}
    >
      <Skeleton variant="circular" width={44} height={44} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="50%" height={18} />
        <Skeleton variant="text" width="70%" height={14} />
      </Box>
      <Skeleton variant="text" width={32} height={12} />
    </Box>
  );

  const renderEmpty = () => (
    <Box
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.xl}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.lg}px`,
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: "32px",
          bgcolor: tc.iconBackground,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          mb: `${mobileTheme.spacing.md}px`,
        }}
      >
        <Icon sx={{ fontSize: 32, color: tc.primary }}>chat_bubble_outline</Icon>
      </Box>
      <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: `${mobileTheme.spacing.xs}px` }}>
        No messages yet
      </Typography>
      <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
        Start a conversation with someone in your church.
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: `${mobileTheme.spacing.md}px`,
        }}
      >
        <Typography sx={{ fontSize: 24, fontWeight: 700, color: tc.text }}>Messages</Typography>
        <IconButton
          aria-label="New message"
          onClick={() => router.push("/mobile/messages/new")}
          sx={{
            bgcolor: tc.iconBackground,
            color: tc.primary,
            "&:hover": { bgcolor: tc.iconBackground },
          }}
        >
          <Icon>edit</Icon>
        </IconButton>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
        {conversations === null && [0, 1, 2].map(renderSkeleton)}
        {conversations !== null && conversations.length === 0 && renderEmpty()}
        {conversations !== null && conversations.length > 0 && conversations.map(renderRow)}
      </Box>
    </Box>
  );
};
