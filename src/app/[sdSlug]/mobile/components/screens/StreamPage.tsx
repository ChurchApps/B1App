"use client";

import React, { useEffect, useRef, useState } from "react";
import { Box, Icon } from "@mui/material";
import { Locale, ConversationStore } from "@churchapps/apphelper";
import { DateHelper, type ConversationInterface, type MessageInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { ChatHelper } from "@/helpers/ChatHelper";
import { ChatConfigHelper } from "@/helpers/ChatConfigHelper";
import { StreamingServiceHelper } from "@/helpers/StreamingServiceHelper";
import { StreamChatManager } from "@/helpers/StreamChatManager";
import type { ChatStateInterface, StreamConfigInterface, StreamingServiceExtendedInterface, StreamingTabInterface } from "@/helpers";
import { VideoContainer } from "@/components/video/VideoContainer";
import { Chat } from "@/components/video/chat/Chat";
import { HostChat } from "@/components/video/chat/host";
import { mobileTheme } from "../mobileTheme";
import { BackVerb, PageHead, Plate, PlateSection, QuietEmpty, Row, RowList, StatusBadge, TextLink, useSliceView } from "../kit";

interface Props {
  config: ConfigurationInterface;
}

const tc = mobileTheme.colors;
const TAB_SANDBOX = "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox";

const tabUrl = (tab: StreamingTabInterface) => {
  let url = tab.url || "";
  if (tab.type === "page" && !url.startsWith("http") && !url.startsWith("/stream")) url = EnvironmentHelper.Common.ContentRoot + "/" + url;
  return /^https?:\/\//i.test(url) || url.startsWith("/stream") ? url : "";
};

const formatStart = (date: Date) => {
  const d = date.toLocaleDateString(DateHelper.locale, { weekday: "long", month: "short", day: "numeric" });
  const t = date.toLocaleTimeString(DateHelper.locale, { hour: "numeric", minute: "2-digit" });
  return `${d}, ${t}`;
};

const startsIn = (ms: number) => {
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.max(1, Math.floor((ms % 3600000) / 60000));
  if (days > 0) return Locale.label("mobile.stream.startsInDays").replace("{}", String(days)).replace("{}", String(hours));
  if (hours > 0) return Locale.label("mobile.stream.startsInHours").replace("{}", String(hours)).replace("{}", String(minutes));
  return Locale.label("mobile.stream.startsInMinutes").replace("{}", String(minutes));
};

// Last couple of chat lines as the section teaser; the full chat lives in the slice.
const ChatTeaser = ({ conversationId }: { conversationId: string }) => {
  const [messages, setMessages] = useState<MessageInterface[]>([]);
  useEffect(() => ConversationStore.subscribe(conversationId, (conv: ConversationInterface) => setMessages(conv.messages ?? [])), [conversationId]);
  const recent = messages.filter((m) => m.messageType === "message" || !m.messageType).slice(-2);
  if (recent.length === 0) return <QuietEmpty>{Locale.label("mobile.components.noMessages")}</QuietEmpty>;
  return (
    <RowList>
      {recent.map((m, i) => <Row key={m.id ?? i} title={m.displayName || Locale.label("mobile.components.unknown")} subtitle={m.content} sx={{ minHeight: 48 }} />)}
    </RowList>
  );
};

export const StreamPage = ({ config }: Props) => {
  const keyName = config?.church?.subDomain;
  const [view, setView] = useSliceView();
  const [streamConfig, setStreamConfig] = useState<StreamConfigInterface | null>(null);
  const [chatState, setChatState] = useState<ChatStateInterface | null>(null);
  const [currentService, setCurrentService] = useState<StreamingServiceExtendedInterface | null>(null);
  const [chatReady, setChatReady] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const joinedServiceIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!keyName) return;
    StreamChatManager.initUser();
    setChatState({ ...ChatHelper.current });
    const stopTimer = StreamingServiceHelper.initTimer((cs) => { setCurrentService(cs); });
    const loadData = async () => {
      const response = await fetch(`${EnvironmentHelper.Common.ContentApi}/preview/data/${keyName}`);
      if (!response.ok) throw new Error("Stream config request failed: " + response.status);
      const result: StreamConfigInterface = await response.json();
      StreamingServiceHelper.updateServiceTimes(result);
      result.keyName = keyName;
      ChatConfigHelper.current = result;
      setStreamConfig(result);
      await StreamChatManager.initStream();
      setChatReady(true);
    };
    loadData().catch((error) => console.error("Failed to load stream config:", error));
    return () => {
      stopTimer();
      const main = ChatHelper.current.mainConversation;
      const host = ChatHelper.current.hostConversation;
      if (main) StreamChatManager.leaveRoom(main);
      if (host) StreamChatManager.leaveRoom(host);
      ChatHelper.current.mainConversation = null;
      ChatHelper.current.hostConversation = null;
      joinedServiceIdRef.current = null;
    };
  }, [keyName]);

  useEffect(() => {
    if (!(currentService && streamConfig && chatReady)) return;
    if (joinedServiceIdRef.current === currentService.id) return;
    joinedServiceIdRef.current = currentService.id || null;
    (async () => {
      await StreamChatManager.joinMainRoom(ChatConfigHelper.current.churchId || "", currentService);
      await StreamChatManager.checkHost(streamConfig, currentService.id || "");
      setChatState({ ...ChatHelper.current });
    })().catch((error) => console.error("Failed to join stream chat:", error));
  }, [currentService, chatReady, streamConfig]);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(id);
  }, []);

  const start = currentService?.localStartTime;
  const end = currentService?.localEndTime;
  const isLive = !!(now && start && end && now >= start.getTime() && now <= end.getTime());
  const countdownMs = currentService?.localCountdownTime && now ? currentService.localCountdownTime.getTime() - now : null;
  // Same rule as the website player: the video frame appears an hour before the service.
  const showPlayer = !!currentService && (countdownMs === null || countdownMs <= 3600 * 1000);
  const serviceTitle = currentService?.label || currentService?.sermon?.title || "";

  const title = Locale.label("mobile.screenTitles.stream");
  const tabs = streamConfig?.tabs || [];
  const user = chatState?.user ?? ChatHelper.current.user;

  const media = (
    <Box sx={{ px: { xs: "12px", md: 0 }, pb: "16px" }}>
      <Box sx={{
        maxWidth: 880,
        position: "relative",
        aspectRatio: "16 / 9",
        borderRadius: "10px",
        overflow: "hidden",
        bgcolor: tc.primaryDeep,
        color: "#fff",
        "& #videoContainer": { position: "absolute", inset: 0 },
        "& #videoContainer iframe, & #noVideoContent": { position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 },
        "& #noVideoContent h3, & #noVideoContent p": { color: "#fff", m: 0 }
      }}>
        {showPlayer
          ? <VideoContainer overlayContent={false} currentService={currentService} embedded={true} />
          : (
            <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: "4px", p: "16px 18px" }}>
              <Box component="span" sx={{ fontSize: 11, lineHeight: "16px", fontWeight: 650, letterSpacing: "0.09em", textTransform: "uppercase", opacity: 0.8 }}>
                {countdownMs !== null && countdownMs > 0 ? startsIn(countdownMs) : Locale.label("mobile.stream.offlineBody")}
              </Box>
              <Box component="span" sx={{ fontSize: 22, lineHeight: "27px", fontWeight: 650, letterSpacing: "-0.01em" }}>
                {serviceTitle || Locale.label("mobile.stream.offlineTitle")}
              </Box>
            </Box>
          )}
      </Box>
    </Box>
  );

  const head = (
    <PageHead
      title={(
        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {title}
          {isLive
            ? <StatusBadge tone="bad" dot>{Locale.label("mobile.stream.live")}</StatusBadge>
            : <StatusBadge tone="neu">{Locale.label("mobile.stream.offline")}</StatusBadge>}
        </Box>
      )}
      lede={!isLive && currentService?.localCountdownTime && countdownMs !== null && countdownMs > 0
        ? Locale.label("mobile.stream.nextStream").replace("{}", formatStart(currentService.localCountdownTime))
        : undefined}
    />
  );

  const renderFull = (tab: StreamingTabInterface) => {
    if (tab.type === "chat") {
      return chatState?.mainConversation
        ? <Chat conversation={chatState.mainConversation} user={user} visible={true} enableAttendance={true} embedded={true} />
        : <QuietEmpty>{Locale.label("mobile.stream.chatClosed")}</QuietEmpty>;
    }
    if (tab.type === "hostchat") {
      return chatState?.hostConversation
        ? <HostChat conversation={chatState.hostConversation} user={user} visible={true} />
        : <QuietEmpty>{Locale.label("mobile.stream.chatClosed")}</QuietEmpty>;
    }
    const src = tabUrl(tab);
    return src
      ? <Box component="iframe" src={src} title={tab.text} sandbox={TAB_SANDBOX} sx={{ display: "block", width: "100%", height: "70vh", border: 0, borderRadius: "6px" }} />
      : null;
  };

  const sliceIndex = view.startsWith("tab") ? parseInt(view.slice(3), 10) : -1;
  const sliceTab = sliceIndex >= 0 ? tabs[sliceIndex] : undefined;

  if (sliceTab) {
    return (
      <Box>
        {head}
        {media}
        <BackVerb label={Locale.label("mobile.stream.backToStream")} onClick={() => setView("")} />
        <Plate>
          <PlateSection title={sliceTab.text} sx={{
            "& #chatReceive": { maxHeight: "55vh", overflowY: "auto", py: "4px" },
            "& #chatSend": { pt: "10px" },
            "& #attendanceCount": { display: "inline-block", mb: "8px", color: tc.link, fontSize: 13.5, textDecoration: "none" },
            "& #chatClosed": { pt: "10px", color: tc.textSecondary, fontSize: 14 }
          }}>
            {renderFull(sliceTab)}
          </PlateSection>
        </Plate>
      </Box>
    );
  }

  const chatTabs = tabs.map((t, i) => ({ t, i })).filter(({ t }) => t.type === "chat" || t.type === "hostchat");
  const otherTabs = tabs.map((t, i) => ({ t, i })).filter(({ t }) => t.type !== "chat" && t.type !== "hostchat" && tabUrl(t));

  return (
    <Box>
      {head}
      {media}
      {(chatTabs.length > 0 || otherTabs.length > 0) && (
        <Plate>
          {chatTabs.map(({ t, i }) => {
            const conversation = t.type === "chat" ? chatState?.mainConversation : chatState?.hostConversation;
            return (
              <PlateSection
                key={i}
                title={t.text}
                action={conversation ? <TextLink onClick={() => setView(`tab${i}`)}>{Locale.label("mobile.stream.openChat")}</TextLink> : undefined}
              >
                {conversation?.id
                  ? <ChatTeaser conversationId={conversation.id} />
                  : <QuietEmpty>{Locale.label("mobile.stream.chatClosed")}</QuietEmpty>}
              </PlateSection>
            );
          })}
          {otherTabs.length > 0 && (
            <PlateSection>
              <RowList>
                {otherTabs.map(({ t, i }) => (
                  <Row
                    key={i}
                    onClick={() => setView(`tab${i}`)}
                    leading={t.icon ? <Icon sx={{ color: tc.textSecondary }}>{t.icon}</Icon> : undefined}
                    title={t.text}
                    chevron
                  />
                ))}
              </RowList>
            </PlateSection>
          )}
        </Plate>
      )}
    </Box>
  );
};
