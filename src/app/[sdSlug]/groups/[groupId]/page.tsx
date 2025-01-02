import { ConfigHelper, EnvironmentHelper, GlobalStyleInterface, PageInterface } from "@/helpers";
import { DefaultPageWrapper } from "../../[pageSlug]/components/DefaultPageWrapper";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { ChurchInterface, ApiHelper } from "@churchapps/apphelper";
import { Metadata } from "next";

type PageParams = Promise<{ sdSlug: string; groupId: string; }>

const loadSharedData = (sdSlug: string,) => {
    EnvironmentHelper.init();
    //const result = unstable_cache(loadData, ["/[sdSlug]", sdSlug], {tags:["all", "sdSlug=" + sdSlug]});
    //return result(sdSlug, );
    return loadData(sdSlug);
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
    const { sdSlug } = await params;
    const props = await loadSharedData(sdSlug);
    return MetaHelper.getMetaData("Hello World" + " - " + props.church.name, "Hello World", props.churchSettings.ogImage);
}

const loadData = async (sdSlug: string) => {

    const church: ChurchInterface = await ApiHelper.getAnonymous("/churches/lookup?subDomain=" + sdSlug, "MembershipApi");
    const churchSettings: any = await ApiHelper.getAnonymous("/settings/public/" + church.id, "MembershipApi");
    const globalStyles: GlobalStyleInterface = await ApiHelper.getAnonymous("/globalStyles/church/" + church.id, "ContentApi");
    const navLinks: any = await ApiHelper.getAnonymous("/links/church/" + church.id + "?category=website", "ContentApi");

    const config: ConfigurationInterface = await ConfigHelper.load(church.subDomain);

    return { church, churchSettings, navLinks, globalStyles, config }
}

export default async function GroupPage({ params }: { params: PageParams }) {
    await EnvironmentHelper.initServerSide();
    const { sdSlug, groupId } = await params
    const { church, churchSettings, globalStyles, navLinks } = await loadSharedData(sdSlug);

    return (
        <DefaultPageWrapper churchSettings={churchSettings} church={church} navLinks={navLinks} globalStyles={globalStyles}>

            <h1>Howdy World</h1>
        </DefaultPageWrapper>
    );
}
