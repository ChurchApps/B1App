"use client";

import dynamic from "next/dynamic";
import { ScreenSkeleton } from "./ScreenSkeleton";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { PlaceholderPage } from "./PlaceholderPage";

const loading = () => <ScreenSkeleton />;

const SermonDetail = dynamic(() => import("./details/SermonDetail").then(m => ({ default: m.SermonDetail })), { loading });
const PlanDetail = dynamic(() => import("./details/PlanDetail").then(m => ({ default: m.PlanDetail })), { loading });
const GroupDetail = dynamic(() => import("./details/GroupDetail").then(m => ({ default: m.GroupDetail })), { loading });
const CommunityDetail = dynamic(() => import("./details/CommunityDetail").then(m => ({ default: m.CommunityDetail })), { loading });
const MessageConversation = dynamic(() => import("./details/MessageConversation").then(m => ({ default: m.MessageConversation })), { loading });
const VolunteerDetail = dynamic(() => import("./details/VolunteerDetail").then(m => ({ default: m.VolunteerDetail })), { loading });
const PlaylistDetail = dynamic(() => import("./details/PlaylistDetail").then(m => ({ default: m.PlaylistDetail })), { loading });
const MessageComposePage = dynamic(() => import("./screens/MessageComposePage").then(m => ({ default: m.MessageComposePage })), { loading });
const EventRegisterPage = dynamic(() => import("./screens/EventRegisterPage").then(m => ({ default: m.EventRegisterPage })), { loading });

interface Props {
  pageSlug: string;
  id: string;
  config: ConfigurationInterface;
}

export function DetailRouter({ pageSlug, id, config }: Props) {
  if (pageSlug === "messages" && (id === "new" || id === "compose")) {
    return <MessageComposePage config={config} />;
  }
  switch (pageSlug) {
    case "register": return <EventRegisterPage eventId={id} config={config} />;
    case "sermons":
    case "sermonDetails": return <SermonDetail id={id} config={config} />;
    case "plans":
    case "plan":
    case "planDetails": return <PlanDetail id={id} config={config} />;
    case "groups":
    case "myGroups":
    case "groupDetails": return <GroupDetail id={id} config={config} />;
    case "community":
    case "membersSearch":
    case "memberDetail": return <CommunityDetail id={id} config={config} />;
    case "messages": return <MessageConversation id={id} config={config} />;
    case "volunteer":
    case "volunteerBrowse":
    case "volunteerSignup": return <VolunteerDetail id={id} config={config} />;
    case "playlist":
    case "playlistDetails": return <PlaylistDetail id={id} config={config} />;
    default: return <PlaceholderPage title={`${pageSlug} detail`} icon="apps" description={`Detail view for '${pageSlug}' isn't available yet.`} />;
  }
}
