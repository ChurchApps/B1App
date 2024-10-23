"use client";

import { useRouter } from "next/navigation";
import { ConfigHelper, GlobalStyleInterface, WrapperPageProps } from "@/helpers";
import { ApiHelper, ChurchInterface, UserHelper } from "@churchapps/apphelper";
import React from "react";
import ContentEditor from "@/components/admin/ContentEditor/ContentEditor";

interface Props extends WrapperPageProps {
  church: ChurchInterface;
  churchSettings: any;
  globalStyles: GlobalStyleInterface;
  blockId: string;
}

export function BlockEditorClient(props: Props) {
  const router = useRouter();
  const id = props.blockId;

  const loadData = async (id: string) => {
    return await ApiHelper.get("/blocks/" + UserHelper.currentUserChurch.church.id + "/tree/" + id, "ContentApi");
  };

  const handleDone = () => {
    router.push("/admin/site/pages/preview/" + id);
  };

  return (
    <ContentEditor
      loadData={loadData}
      church={props.church}
      churchSettings={props.churchSettings}
      globalStyles={props.globalStyles}
      blockId={id}
      config={props.config}
      onDone={handleDone}
    />
  );
}
