"use client";

import { WrapperPageProps } from "@/helpers";
import { ApiHelper, UserHelper } from "@churchapps/apphelper";
import React from "react";
import ContentEditor from "@/components/admin/ContentEditor/ContentEditor";
import { redirect } from "next/navigation";

interface Props extends WrapperPageProps {
  pageId: string;
}

export function ContentEditorClient(props: Props) {
  const id = props.pageId;

  const loadData = async (id: string) =>
    await ApiHelper.get("/pages/" + UserHelper.currentUserChurch.church.id + "/tree?id=" + id, "ContentApi");

  const handleDone = (url?: string) => {
    if (url && url !== '') redirect(url);
    else redirect("/admin/site/pages/preview/" + id);
  };

  return (
    <ContentEditor
      loadData={loadData}
      config={props.config}
      pageId={id}
      onDone={handleDone}
    />
  );
}
