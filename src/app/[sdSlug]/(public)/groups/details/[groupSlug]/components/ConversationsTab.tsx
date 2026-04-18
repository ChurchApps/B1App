"use client";

import React, { useState, useEffect } from "react";
import { Tabs, Tab, Box } from "@mui/material";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import { ConversationInterface, UserContextInterface } from "@churchapps/helpers";
import { Conversations } from "@/components/notes/Conversations";

interface Props {
  context: UserContextInterface;
  groupId: string;
  isLeader: boolean;
}

type ChatTab = "discussions" | "announcements";

export function ConversationsTab(props: Props) {
  const [activeTab, setActiveTab] = useState<ChatTab>("discussions");
  const [hasAnnouncements, setHasAnnouncements] = useState<boolean | null>(null);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (!props.isLeader && props.groupId) {
      checkForAnnouncements();
    }
  }, [props.groupId, props.isLeader]);

  useEffect(() => {
    setKey(prev => prev + 1);
  }, [activeTab]);

  const checkForAnnouncements = async () => {
    try {
      const response: ConversationInterface[] = await ApiHelper.get(
        `/conversations/messages/groupAnnouncement/${props.groupId}?page=1&limit=1`,
        "MessagingApi"
      );
      const hasAny = response?.some(c => c.messages && c.messages.length > 0) ?? false;
      setHasAnnouncements(hasAny);
    } catch (error) {
      setHasAnnouncements(false);
    }
  };

  const showTabBar = props.isLeader || hasAnnouncements;

  const handleTabChange = (event: React.SyntheticEvent, newValue: ChatTab) => {
    setActiveTab(newValue);
  };

  const getConversationsContent = () => {
    const contentType = activeTab === "discussions" ? "group" : "groupAnnouncement";
    const canPost = activeTab === "discussions" || props.isLeader;

    return (
      <Conversations
        key={key}
        context={props.context}
        contentType={contentType}
        contentId={props.groupId}
        groupId={props.groupId}
        canPost={canPost}
      />
    );
  };

  return (
    <>
      <h2>{Locale.label("groups.conversations") || "Conversations"}</h2>
      {showTabBar && (
        <Box sx={{ borderBottom: 1, borderColor: "divider", marginBottom: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab
              label={Locale.label("groups.discussions") || "Discussions"}
              value="discussions"
            />
            <Tab
              label={Locale.label("groups.announcements") || "Announcements"}
              value="announcements"
            />
          </Tabs>
        </Box>
      )}
      {getConversationsContent()}
    </>
  );
}
