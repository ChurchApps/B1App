"use client";

import { redirect } from "next/navigation";
import { WrapperPageProps } from "@/helpers";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import { UserHelper } from "@churchapps/apphelper/dist/helpers/UserHelper";
import React from "react";
import ContentEditor from "@/components/admin/ContentEditor/ContentEditor";

interface Props extends WrapperPageProps {
  blockId: string;
}

export function BlockEditorClient(props: Props) {
  const id = props.blockId;

  const loadData = async (id: string) => await ApiHelper.get("/blocks/" + UserHelper.currentUserChurch.church.id + "/tree/" + id, "ContentApi");

  const handleDone = () => {
    redirect("/admin/site/pages/preview/" + id);
  };

  return (
    <ContentEditor
      loadData={loadData}
      blockId={id}
      config={props.config}
      onDone={handleDone}
    />
  );
}
