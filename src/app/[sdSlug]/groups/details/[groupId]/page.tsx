import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { DefaultPageWrapper } from "../../../[pageSlug]/components/DefaultPageWrapper";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { ApiHelper, GroupInterface, GroupMemberInterface, EventInterface } from "@churchapps/apphelper";
import { Metadata } from "next";
import { Theme } from "@/components";
import { GroupClient } from "./components/GroupClient";

type PageParams = Promise<{ sdSlug: string; groupId: string; }>

const loadSharedData = (sdSlug: string, groupId: string) => {
  EnvironmentHelper.init();
  //const result = unstable_cache(loadData, ["/[sdSlug]", sdSlug], {tags:["all", "sdSlug=" + sdSlug]});
  //return result(sdSlug, );
  return loadData(sdSlug, groupId);
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { sdSlug, groupId } = await params;
  const props = await loadSharedData(sdSlug, groupId);
  return MetaHelper.getMetaData(props.group?.name + " - " + props.config.church.name, props.group?.about, props.config.appearance.ogImage);
}

const loadData = async (sdSlug: string, groupId: string) => {
  const config: ConfigurationInterface = await ConfigHelper.load(sdSlug, "website");
  const group: GroupInterface = await ApiHelper.get("/groups/public/" + config.church.id + "/" + groupId, "MembershipApi");
  const events: EventInterface[] = await ApiHelper.get("/events/public/group/" + config.church.id + "/" + groupId, "ContentApi");
  const leaders: GroupMemberInterface[] = await ApiHelper.get("/groupMembers/public/leaders/" + config.church.id + "/" + groupId, "MembershipApi");

  return { config, group, events, leaders }
}


export default async function GroupPage({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, groupId } = await params
  const { group, events, leaders, config } = await loadSharedData(sdSlug, groupId);


  return (<>
    <Theme config={config} />
    <DefaultPageWrapper config={config}>
      <GroupClient config={config} group={group} events={events} leaders={leaders} />
    </DefaultPageWrapper>
  </>);
}
