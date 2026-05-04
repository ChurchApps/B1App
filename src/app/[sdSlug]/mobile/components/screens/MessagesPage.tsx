"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Box, Icon, IconButton, Skeleton, Typography } from "@mui/material";
import { ApiHelper, Locale, PersonHelper, SocketHelper } from "@churchapps/apphelper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { PersonInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import UserContext from "@/context/UserContext";
import { mobileTheme } from "../mobileTheme";
import { getInitials } from "../util";

interface Props {
  config?: ConfigurationInterface;
}

interface Conversation {
  id: string;
  personId: string;
  conversationId?: string;
  personName: string;
  personPhoto?: string;
}

export const MessagesPage = ({ config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const userContext = React.useContext(UserContext);
  const loggedIn = !!userContext?.user?.firstName;
  const myPersonId = userContext?.person?.id;
  const queryClient = useQueryClient();

  // Real-time: when a privateMessage / privateRoomAdded socket event arrives, invalidate the list.
  React.useEffect(() => {
    if (!loggedIn) return;
    const id = "MessagesPage-list";
    const onEvent = () => queryClient.invalidateQueries({ queryKey: ["conversations", myPersonId] });
    SocketHelper.addHandler("privateMessage", id + "-pm", onEvent);
    SocketHelper.addHandler("privateRoomAdded", id + "-room", onEvent);
    return () => {
      SocketHelper.removeHandler(id + "-pm");
      SocketHelper.removeHandler(id + "-room");
    };
  }, [loggedIn, myPersonId, queryClient]);

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
          conversationId: pm.conversationId,
          personName: displayName,
          personPhoto: photo
        };
      });
    },
    enabled: loggedIn
  });

  const renderAvatar = (c: Conversation) => {
    const common = {
      width: 44,
      height: 44,
      borderRadius: "22px",
      flexShrink: 0,
      overflow: "hidden"
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
          fontSize: 14
        }}
      >
        {getInitials(c.personName)}
      </Box>
    );
  };

  const handleClick = (c: Conversation) => {

    const path = `/mobile/messages/${c.personId}`;
    router.push(c.conversationId ? `${path}?conversationId=${encodeURIComponent(c.conversationId)}` : path);
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
        "&:active": { transform: "scale(0.995)" }
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
            whiteSpace: "nowrap"
          }}
        >
          {c.personName}
        </Typography>
      </Box>
      <Icon sx={{ color: tc.textSecondary, flexShrink: 0 }}>chevron_right</Icon>
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
        py: "12px"
      }}
    >
      <Skeleton variant="circular" width={44} height={44} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="50%" height={18} />
      </Box>
    </Box>
  );

  const renderEmpty = () => (
    <Box
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.xl}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.lg}px`,
        textAlign: "center"
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
          mb: `${mobileTheme.spacing.md}px`
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
          justifyContent: "flex-end",
          mb: `${mobileTheme.spacing.md}px`
        }}
      >
        <IconButton
          aria-label={Locale.label("mobile.screens.newMessage")}
          onClick={() => router.push("/mobile/messages/new")}
          sx={{
            bgcolor: tc.iconBackground,
            color: tc.primary,
            "&:hover": { bgcolor: tc.iconBackground }
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
