import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { Metadata } from "next";

import { MobilePageWrapper } from "../../components/MobilePageWrapper";
import { PlaceholderPage } from "../../components/PlaceholderPage";
import { SermonDetail } from "../../components/details/SermonDetail";
import { PlanDetail } from "../../components/details/PlanDetail";
import { GroupDetail } from "../../components/details/GroupDetail";
import { CommunityDetail } from "../../components/details/CommunityDetail";
import { MessageConversation } from "../../components/details/MessageConversation";
import { VolunteerDetail } from "../../components/details/VolunteerDetail";
import { PlaylistDetail } from "../../components/details/PlaylistDetail";
import { MessageComposePage } from "../../components/screens/MessageComposePage";
import { EventRegisterPage } from "../../components/screens/EventRegisterPage";

type PageParams = Promise<{ sdSlug: string; pageSlug: string; id: string }>;

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

const getDetail = (pageSlug: string, id: string, config: ConfigurationInterface) => {
  // Special case: /mobile/messages/new → compose flow instead of detail
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
};

export default async function MobileDetailPage({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, pageSlug, id } = await params;

  if (!id || id === "undefined" || id.trim() === "") {
    return (
      <MobilePageWrapper sdSlug={sdSlug} config={(await loadData(sdSlug)).config}>
        <PlaceholderPage title="Invalid link" icon="error_outline" description="The requested ID is missing or invalid." />
      </MobilePageWrapper>
    );
  }

  const { config } = await loadData(sdSlug);

  return (
    <MobilePageWrapper sdSlug={sdSlug} config={config}>
      {getDetail(pageSlug, id, config)}
    </MobilePageWrapper>
  );
}
