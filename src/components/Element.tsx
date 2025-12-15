"use client";

import React from "react";
import { Element as AppHelperElement, ElementBlock } from "@churchapps/apphelper-website";
import type { ChurchInterface } from "@churchapps/helpers";
import { ElementInterface, SectionInterface } from "@/helpers";
import { LiveStream } from "./video/LiveStream";

interface Props {
  element: ElementInterface;
  church?: ChurchInterface;
  churchSettings: any;
  textColor: string;
  onEdit?: (section: SectionInterface | null, element: ElementInterface) => void;
  onMove?: () => void;
  parentId?: string;
}

const StreamElement: React.FC<{ element: ElementInterface; churchSettings: any; church: ChurchInterface; editMode: boolean }> = (props) => {
  const mode = props.element.answers?.mode;
  const includeInteraction = mode !== "video";

  let offlineContent: React.ReactElement | undefined = undefined;
  if (props.element.answers?.offlineContent === "hide") offlineContent = (props.editMode) ? (<>Offline Video Placeholder</>) : (<></>);
  else if (props.element.answers?.offlineContent === "block") offlineContent = <ElementBlock key={props.element.id} element={props.element as ElementInterface} churchSettings={props.churchSettings} textColor={"#333333"} />;

  return <LiveStream includeHeader={false} includeInteraction={includeInteraction} keyName={props.church.subDomain || ""} appearance={props.churchSettings} offlineContent={offlineContent} />;
};

export const Element: React.FC<Props> = (props) => {
  if (props.element.elementType === "stream" && props.church) {
    return <StreamElement element={props.element} churchSettings={props.churchSettings} church={props.church} editMode={!!props.onEdit} />;
  }

  return <AppHelperElement {...props} />;
};
