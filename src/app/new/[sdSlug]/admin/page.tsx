import { Metadata } from "next";
import { ConfigHelper } from "@/helpers";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { unstable_cache } from "next/cache";
import { MetaHelper } from "@/helpers/MetaHelper";
import { B1Settings } from "@/components/admin/settings/B1Settings";


// type PageParams = {sdSlug:string }
type PageParams = Promise<{ sdSlug: string;  }>


const loadData = async (sdSlug:string) => {
  const config = await ConfigHelper.load(sdSlug.toString());
  return { config }
}

const loadSharedData = (sdSlug:string) => {
  const result = unstable_cache(loadData, ["/[sdSlug]", sdSlug], {tags:["all"]});
  return result(sdSlug);
}


export async function generateMetadata({params}: {params:PageParams}): Promise<Metadata> {
  const {sdSlug}= await params
  const props = await loadSharedData(sdSlug);
  return MetaHelper.getMetaData(props.config.church.name + " - Mobile App Settings");
}

export default async function Admin({params}: {params:PageParams}) {
  //const { isAuthenticated } = ApiHelper;
  //useEffect(() => { if (!isAuthenticated) router.redirect("/login"); }, []);
  const {sdSlug}= await params
  const props = await loadData(sdSlug);

  return (
    <AdminWrapper config={props.config}>
      <h1>Mobile App Settings</h1>
      <B1Settings />
    </AdminWrapper>
  );
}

