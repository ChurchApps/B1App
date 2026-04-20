"use client";

import React from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ScreenSkeleton } from "./ScreenSkeleton";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { PlaceholderPage } from "./PlaceholderPage";

const loading = () => <ScreenSkeleton />;

const DashboardPage = dynamic(() => import("./DashboardPage").then(m => ({ default: m.DashboardPage })), { loading });
const SermonsPage = dynamic(() => import("./screens/SermonsPage").then(m => ({ default: m.SermonsPage })), { loading });
const VotdPage = dynamic(() => import("./screens/VotdPage").then(m => ({ default: m.VotdPage })), { loading });
const BiblePage = dynamic(() => import("./screens/BiblePage").then(m => ({ default: m.BiblePage })), { loading });
const StreamPage = dynamic(() => import("./screens/StreamPage").then(m => ({ default: m.StreamPage })), { loading });
const LessonsPage = dynamic(() => import("./screens/LessonsPage").then(m => ({ default: m.LessonsPage })), { loading });
const GroupsPage = dynamic(() => import("./screens/GroupsPage").then(m => ({ default: m.GroupsPage })), { loading });
const CommunityPage = dynamic(() => import("./screens/CommunityPage").then(m => ({ default: m.CommunityPage })), { loading });
const MessagesPage = dynamic(() => import("./screens/MessagesPage").then(m => ({ default: m.MessagesPage })), { loading });
const DonatePage = dynamic(() => import("./screens/DonatePage").then(m => ({ default: m.DonatePage })), { loading });
const CheckinPage = dynamic(() => import("./screens/CheckinPage").then(m => ({ default: m.CheckinPage })), { loading });
const PlansPage = dynamic(() => import("./screens/PlansPage").then(m => ({ default: m.PlansPage })), { loading });
const RegistrationsPage = dynamic(() => import("./screens/RegistrationsPage").then(m => ({ default: m.RegistrationsPage })), { loading });
const VolunteerPage = dynamic(() => import("./screens/VolunteerPage").then(m => ({ default: m.VolunteerPage })), { loading });
const NotificationsPage = dynamic(() => import("./screens/NotificationsPage").then(m => ({ default: m.NotificationsPage })), { loading });
const ProfileEditPage = dynamic(() => import("./screens/ProfileEditPage").then(m => ({ default: m.ProfileEditPage })), { loading });
const WebsiteUrlPage = dynamic(() => import("./screens/WebsiteUrlPage").then(m => ({ default: m.WebsiteUrlPage })), { loading });
const MessageComposePage = dynamic(() => import("./screens/MessageComposePage").then(m => ({ default: m.MessageComposePage })), { loading });
const MobileLoginScreen = dynamic(() => import("./screens/LoginPage").then(m => ({ default: m.MobileLoginScreen })), { loading });

interface Props {
  pageSlug: string;
  config: ConfigurationInterface;
}

const ALIAS_TO_CANONICAL: Record<string, string> = { membersSearch: "community" };

export function ScreenRouter({ pageSlug, config }: Props) {
  const router = useRouter();

  React.useEffect(() => {
    const canonical = ALIAS_TO_CANONICAL[pageSlug];
    if (canonical) router.replace(`/mobile/${canonical}`);
  }, [pageSlug, router]);

  const effectiveSlug = ALIAS_TO_CANONICAL[pageSlug] ?? pageSlug;

  switch (effectiveSlug) {
    case "dashboard": return <DashboardPage config={config} />;
    case "sermons": return <SermonsPage config={config} />;
    case "groups":
    case "myGroups": return <GroupsPage config={config} />;
    case "community": return <CommunityPage config={config} />;
    case "donate":
    case "donation": return <DonatePage config={config} />;
    case "checkin":
    case "service": return <CheckinPage config={config} />;
    case "plans":
    case "plan": return <PlansPage config={config} />;
    case "votd": return <VotdPage />;
    case "bible": return <BiblePage />;
    case "notifications": return <NotificationsPage config={config} />;
    case "registrations": return <RegistrationsPage config={config} />;
    case "volunteer":
    case "volunteerBrowse": return <VolunteerPage config={config} />;
    case "messages":
    case "searchMessageUser": return <MessagesPage config={config} />;
    case "messagesNew":
    case "composeMessage": return <MessageComposePage config={config} />;
    case "lessons": return <LessonsPage />;
    case "profileEdit": return <ProfileEditPage config={config} />;
    case "stream": return <StreamPage config={config} />;
    case "websiteUrl":
    case "page": return <WebsiteUrlPage config={config} />;
    case "login": return <MobileLoginScreen config={config} />;
    default: return <PlaceholderPage title={pageSlug} icon="apps" description={`The '${pageSlug}' screen is not yet implemented.`} />;
  }
}
