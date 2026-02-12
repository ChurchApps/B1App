import React from "react";
import { Theme } from "@/components";
import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { Metadata } from "next";
import "@churchapps/apphelper-website/dist/styles/animations.css";
import { Animate } from "@churchapps/apphelper-website";
import { FormPage } from "./components/FormPage";
import { notFound } from "next/navigation";
import { DefaultPageWrapper } from "../components/DefaultPageWrapper";


type PageParams = Promise<{ sdSlug: string; pageSlug: string; id:string; }>

const loadSharedData = (sdSlug:string, pageSlug:string) => {
  EnvironmentHelper.init();
  return loadData(sdSlug, pageSlug);
};

export async function generateMetadata({ params }: {params:PageParams}): Promise<Metadata> {
  const { sdSlug, pageSlug } = await params;
  const props = await loadSharedData(sdSlug, pageSlug);

  const title = "Forms";
  return MetaHelper.getMetaData(title + " - " + props.config.church.name, "My", undefined, undefined, props.config.appearance);
}

const loadData = async (sdSlug:string, pageSlug:string) => {
  const config: ConfigurationInterface = await ConfigHelper.load(sdSlug, "website");
  return { config };
};

export default async function Home({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, pageSlug, id } = await params;
  const { config } = await loadSharedData(sdSlug, pageSlug);

  let label = "Plan Details";
  switch (pageSlug) {
    case "forms": label = "Form"; break;
  }

  const getPageContent = () => {
    switch (pageSlug) {
      case "forms": return wrapDefaultPage(<FormPage config={config} formId={id} />);
      default: return notFound();
    }
  };

  const wrapDefaultPage = (content: React.ReactElement) => <DefaultPageWrapper config={config}>
    {content}
  </DefaultPageWrapper>;

  return (
    <>
      <Theme config={config} />
      {getPageContent()}
      <Animate />
    </>
  );
}
