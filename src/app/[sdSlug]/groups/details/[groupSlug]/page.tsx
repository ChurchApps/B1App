import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { DefaultPageWrapper } from "../../../[pageSlug]/components/DefaultPageWrapper";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { ApiHelper } from "@churchapps/apphelper";
import type { GroupInterface } from "@churchapps/helpers";
import type { GroupMemberInterface } from "@churchapps/helpers";
import type { EventInterface } from "@churchapps/helpers";
import { Metadata } from "next";
import { Theme } from "@/components";
import { GroupClient } from "./components/GroupClient";

type PageParams = Promise<{ sdSlug: string; groupSlug: string; }>

const loadSharedData = (sdSlug: string, groupSlug: string) => {
  EnvironmentHelper.init();
  //const result = unstable_cache(loadData, ["/[sdSlug]", sdSlug], {tags:["all", "sdSlug=" + sdSlug]});
  //return result(sdSlug, );
  return loadData(sdSlug, groupSlug);
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { sdSlug, groupSlug } = await params;
  try {
    const props = await loadSharedData(sdSlug, groupSlug);
    const title = props.group?.name ? `${props.group.name} - ${props.config.church.name}` : `Group - ${props.config.church.name}`;
    const description = props.group?.about || "Group information";
    return MetaHelper.getMetaData(title, description);
  } catch (error) {
    console.error("Failed to generate metadata:", error);
    // Fallback metadata
    const config: ConfigurationInterface = await ConfigHelper.load(sdSlug, "website");
    return MetaHelper.getMetaData(`Group - ${config.church.name}`, "Group information");
  }
}

const loadData = async (sdSlug: string, groupSlug: string) => {
  try {
    const config: ConfigurationInterface = await ConfigHelper.load(sdSlug, "website");

    // Try to get the group data
    let group: GroupInterface | null = null;
    let events: EventInterface[] = [];
    let leaders: GroupMemberInterface[] = [];

    try {
      group = await ApiHelper.get("/groups/public/" + config.church.id + "/slug/" + groupSlug, "MembershipApi");

      // Only fetch additional data if group exists
      if (group && group.id) {
        events = await ApiHelper.get("/events/public/group/" + config.church.id + "/" + group.id, "ContentApi").catch((): any[] => []);
        leaders = await ApiHelper.get("/groupMembers/public/leaders/" + config.church.id + "/" + group.id, "MembershipApi").catch((): any[] => []);
      }
    } catch (error) {
      console.error("Failed to load group data:", error);
      // Group will remain null, which will be handled in the component
    }

    return { config, group, events, leaders }
  } catch (error) {
    console.error("Failed to load page data:", error);
    // Return minimal data to prevent complete page failure
    const config: ConfigurationInterface = await ConfigHelper.load(sdSlug, "website");
    return { config, group: null, events: [], leaders: [] }
  }
}


export default async function GroupPage({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, groupSlug } = await params
  const { group, events, leaders, config } = await loadSharedData(sdSlug, groupSlug);


  return (<>
    <Theme config={config} />
    <DefaultPageWrapper config={config}>
      <GroupClient config={config} group={group} events={events} leaders={leaders} />
    </DefaultPageWrapper>
  </>);
}
