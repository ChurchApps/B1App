"use client";

import { GlobalStyleInterface, WrapperPageProps } from "@/helpers";
import { ApiHelper, ChurchInterface, UserHelper } from "@churchapps/apphelper";
import React from "react";
import ContentEditor from "@/components/admin/ContentEditor/ContentEditor";
import { redirect } from "next/navigation";

interface Props extends WrapperPageProps {
  church: ChurchInterface;
  churchSettings: any;
  globalStyles: GlobalStyleInterface;
  pageId: string;
}

export function ContentEditorClient(props: Props) {
  const id = props.pageId;

  const loadData = async (id: string) =>
    await ApiHelper.get("/pages/" + UserHelper.currentUserChurch.church.id + "/tree?id=" + id, "ContentApi");

  const handleDone = () => {
    redirect("/admin/site/pages/preview/" + id);
  };

  return (
    <ContentEditor
      loadData={loadData}
      church={props.church}
      churchSettings={props.churchSettings}
      globalStyles={props.globalStyles}
      pageId={id}
      config={props.config}
      onDone={handleDone}
    />
  );
}
