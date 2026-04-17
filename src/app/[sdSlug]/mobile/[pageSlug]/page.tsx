import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { Metadata } from "next";

import { MobilePageWrapper } from "../components/MobilePageWrapper";
import { DashboardPage } from "../components/DashboardPage";
import { PlaceholderPage } from "../components/PlaceholderPage";

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
    case "sermons": return <PlaceholderPage title="Sermons" icon="play_circle" />;
    case "groups": return <PlaceholderPage title="My Groups" icon="groups" />;
    case "myGroups": return <PlaceholderPage title="My Groups" icon="groups" />;
    case "community": return <PlaceholderPage title="Directory" icon="people" />;
    case "membersSearch": return <PlaceholderPage title="Directory" icon="people" />;
    case "donate": return <PlaceholderPage title="Giving" icon="volunteer_activism" />;
    case "donation": return <PlaceholderPage title="Giving" icon="volunteer_activism" />;
    case "checkin": return <PlaceholderPage title="Check-in" icon="how_to_reg" />;
    case "service": return <PlaceholderPage title="Check-in" icon="how_to_reg" />;
    case "plans": return <PlaceholderPage title="Plans" icon="event_note" />;
    case "plan": return <PlaceholderPage title="Plans" icon="event_note" />;
    case "votd": return <PlaceholderPage title="Verse of the Day" icon="auto_stories" />;
    case "bible": return <PlaceholderPage title="Bible" icon="menu_book" />;
    case "notifications": return <PlaceholderPage title="Notifications" icon="notifications" />;
    case "registrations": return <PlaceholderPage title="Registrations" icon="event_available" />;
    case "volunteer": return <PlaceholderPage title="Volunteer" icon="handshake" />;
    case "messages": return <PlaceholderPage title="Messages" icon="chat" />;
    case "lessons": return <PlaceholderPage title="Lessons" icon="menu_book" />;
    case "profileEdit": return <PlaceholderPage title="Edit Profile" icon="edit" />;
    case "churchSearch": return <PlaceholderPage title="Find Your Church" icon="search" />;
    case "stream": return <PlaceholderPage title="Live Stream" icon="live_tv" />;
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
