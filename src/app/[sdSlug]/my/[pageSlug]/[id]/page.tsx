import { Theme } from "@/components";
import { AuthGuard } from "@/components/AuthGuard";
import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import "@churchapps/apphelper-website/dist/styles/animations.css";
import { Animate } from "@churchapps/apphelper-website";

import { TimelinePage } from "../components/TimelinePage";
import { MyWrapper } from "../components/MyWrapper";

import { PlanClient } from "../components/PlanClient";

type PageParams = Promise<{ sdSlug: string; pageSlug: string; id:string; }>

const loadSharedData = (sdSlug:string, pageSlug:string) => {
  EnvironmentHelper.init();
  return loadData(sdSlug, pageSlug);
};

export async function generateMetadata({ params }: {params:PageParams}): Promise<Metadata> {
  const { sdSlug, pageSlug } = await params;
  const props = await loadSharedData(sdSlug, pageSlug);

  const title = "My....";
  return MetaHelper.getMetaData(title + " - " + props.config.church.name, "My", undefined, undefined, props.config.appearance);
}

const loadData = async (sdSlug:string, pageSlug:string) => {
  const config: ConfigurationInterface = await ConfigHelper.load(sdSlug, "website");
  return { config };
};

export default async function Home({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, pageSlug, id } = await params;

  // Redirect community detail pages to the master-detail view
  if (pageSlug === "community" && id && id !== "undefined" && id.trim() !== "") {
    redirect(`/${sdSlug}/my/community?id=${id}`);
  }

  // Validate id parameter
  if (!id || id === "undefined" || id.trim() === "") {
    return (
      <div>
        <h1>Invalid ID</h1>
        <p>The requested ID is invalid or missing.</p>
      </div>
    );
  }

  const { config } = await loadSharedData(sdSlug, pageSlug);

  let label = "Plan Details";
  switch (pageSlug) {
    case "plans": label = "Plan Details"; break;
    case "forms": label = "Form"; break;
  }

  const getPageContent = () => {
    switch (pageSlug) {
      case "plans": return <PlanClient planId={id} />;
      default: return <TimelinePage />;
    }
  };

  return (
    <>
      <Theme config={config} />
      <AuthGuard sdSlug={sdSlug}>
        <MyWrapper pageSlug={pageSlug} idLabel={label} config={config}>
          {getPageContent()}
        </MyWrapper>
      </AuthGuard>
      <Animate />
    </>
  );
}
