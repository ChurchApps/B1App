import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { Metadata } from "next";

import { MobilePageWrapper } from "../components/MobilePageWrapper";
import { DashboardPage } from "../components/DashboardPage";
import { PlaceholderPage } from "../components/PlaceholderPage";
import { SermonsPage } from "../components/screens/SermonsPage";
import { VotdPage } from "../components/screens/VotdPage";
import { BiblePage } from "../components/screens/BiblePage";
import { StreamPage } from "../components/screens/StreamPage";
import { LessonsPage } from "../components/screens/LessonsPage";
import { GroupsPage } from "../components/screens/GroupsPage";
import { CommunityPage } from "../components/screens/CommunityPage";
import { MessagesPage } from "../components/screens/MessagesPage";
import { DonatePage } from "../components/screens/DonatePage";
import { CheckinPage } from "../components/screens/CheckinPage";
import { PlansPage } from "../components/screens/PlansPage";
import { RegistrationsPage } from "../components/screens/RegistrationsPage";
import { VolunteerPage } from "../components/screens/VolunteerPage";
import { NotificationsPage } from "../components/screens/NotificationsPage";
import { ProfileEditPage } from "../components/screens/ProfileEditPage";
import { ChurchSearchPage } from "../components/screens/ChurchSearchPage";
import { WebsiteUrlPage } from "../components/screens/WebsiteUrlPage";
import { MessageComposePage } from "../components/screens/MessageComposePage";

type PageParams = Promise<{ sdSlug: string; pageSlug: string }>;

const loadData = async (sdSlug: string) => {
  EnvironmentHelper.init();
  const config: ConfigurationInterface = await ConfigHelper.load(sdSlug, "website");
  return { config };
};

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { sdSlug, pageSlug } = await params;
  const { config } = await loadData(sdSlug);
  const title = pageSlug ? pageSlug.charAt(0).toUpperCase() + pageSlug.slice(1) : "Mobile";
  return MetaHelper.getMetaData(title + " - " + config.church.name, title, undefined, config.appearance);
}

const getPageContent = (pageSlug: string, config: ConfigurationInterface) => {
  switch (pageSlug) {
    case "dashboard": return <DashboardPage config={config} />;
    case "sermons": return <SermonsPage config={config} />;
    case "groups":
    case "myGroups": return <GroupsPage config={config} />;
    case "community":
    case "membersSearch": return <CommunityPage config={config} />;
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
    case "churchSearch": return <ChurchSearchPage config={config} />;
    case "stream": return <StreamPage config={config} />;
    case "websiteUrl":
    case "page": return <WebsiteUrlPage config={config} />;
    default: return <PlaceholderPage title={pageSlug} icon="apps" description={`The '${pageSlug}' screen is not yet implemented.`} />;
  }
};

export default async function MobilePage({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, pageSlug } = await params;
  const { config } = await loadData(sdSlug);

  return (
    <MobilePageWrapper sdSlug={sdSlug} config={config}>
      {getPageContent(pageSlug, config)}
    </MobilePageWrapper>
  );
}
