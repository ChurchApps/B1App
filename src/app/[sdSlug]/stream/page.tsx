import { Theme } from "@/components";
import { LiveStream } from "@/components/video/LiveStream";
import { ApiHelper, ChurchInterface, LinkInterface } from "@churchapps/apphelper";
import { PageInterface } from "@/helpers";
import { Suspense } from "react";


interface Props {
  church: ChurchInterface,
  churchSettings: any,
  navLinks: LinkInterface[],
  pageData: any,
}

export default async function StreamPage({ params, searchParams }: { params: { sdSlug: string }, searchParams: { hideHeader?: string } }) {
  const hideHeader = searchParams?.hideHeader || "0";
  const includeHeader = hideHeader !== "1";

  const church: ChurchInterface = await ApiHelper.getAnonymous("/churches/lookup?subDomain=" + params.sdSlug, "MembershipApi");
  const churchSettings: any = await ApiHelper.getAnonymous("/settings/public/" + church.id, "MembershipApi");
  const navLinks: any = await ApiHelper.getAnonymous("/links/church/" + church.id + "?category=website", "ContentApi");
  const pageData: PageInterface = await ApiHelper.getAnonymous("/pages/" + church.id + "/tree?url=/", "ContentApi");

  return (
    <>
      <Theme appearance={churchSettings} globalStyles={{}} />

      <div id="streamRoot">

        <Suspense fallback={<div>Loading stream...</div>}>
          <LiveStream keyName={church.subDomain} appearance={churchSettings} includeHeader={includeHeader} includeInteraction={true} />
        </Suspense>
      </div>
    </>
  );
}
