import { Theme } from "@/components";
import { LiveStream } from "@/components/video/LiveStream";
import { ApiHelper, ChurchInterface, LinkInterface } from "@churchapps/apphelper";
import { EnvironmentHelper, GlobalStyleInterface } from "@/helpers";
import { Suspense } from "react";

interface Props {
  church: ChurchInterface,
  churchSettings: any,
  navLinks: LinkInterface[],
  pageData: any,
}

type Params = Promise<{ sdSlug: string; }>;
type searchParams = Promise<{ hideHeader?: string }>;



export default async function StreamPage({ params, searchParams }: { params: Params, searchParams: searchParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug } = await params
  const { hideHeader } = await searchParams

  const hideHeaders = hideHeader || "0";
  const includeHeader = hideHeaders !== "1";


  const church: ChurchInterface = await ApiHelper.getAnonymous("/churches/lookup?subDomain=" + sdSlug, "MembershipApi");
  const churchSettings: any = await ApiHelper.getAnonymous("/settings/public/" + church.id, "MembershipApi");
  //const navLinks: any = await ApiHelper.getAnonymous("/links/church/" + church.id + "?category=website", "ContentApi");
  //const pageData: PageInterface = await ApiHelper.getAnonymous("/pages/" + church.id + "/tree?url=/", "ContentApi");
  const globalStyles: GlobalStyleInterface = await ApiHelper.getAnonymous("/globalStyles/church/" + church.id, "ContentApi");

  return (
    <>
      <Theme appearance={churchSettings} globalStyles={globalStyles} />

      <div id="streamRoot">

        <Suspense fallback={<div>Loading stream...</div>}>
          <LiveStream keyName={church.subDomain} appearance={churchSettings} includeHeader={includeHeader} includeInteraction={true} />
        </Suspense>
      </div>
    </>
  );
}
