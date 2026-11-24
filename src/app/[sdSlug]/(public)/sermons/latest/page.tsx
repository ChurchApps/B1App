import { redirect } from "next/navigation";
import type { SermonInterface } from "@churchapps/helpers";
import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { fetchCached } from "@/helpers/ConfigHelper";
import { newestSermonsFirst } from "@/helpers/sermonList";

// A stable link (nav menus, emails) to the newest sermon. Rendered per request; the sermon list itself
// comes from the same 5-minute, church-tagged cache as /sermons/[sermonId], so the target page always finds it.
export const dynamic = "force-dynamic";

type PageParams = Promise<{ sdSlug: string }>;

export default async function LatestSermonPage({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug } = await params;
  const config = await ConfigHelper.load(sdSlug, "website");
  let latest: SermonInterface | undefined;
  try {
    latest = newestSermonsFirst(await fetchCached<SermonInterface[]>("/sermons/public/" + config.church.id, "ContentApi", sdSlug))[0];
  } catch { /* fall through to the sermons list */ }
  redirect(latest?.id ? "/sermons/" + encodeURIComponent(latest.id) : "/sermons");
}
