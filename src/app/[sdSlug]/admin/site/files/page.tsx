"use client";
import { ConfigHelper } from "@/helpers";
import { FilesClientWrapper } from "./FilesClientWrapper";

type Params = Promise<{ sdSlug: string; }>


export default async function FilesPage({ params }: { params: Params }) {

  const { sdSlug } = await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return <FilesClientWrapper config={config} />;
}