"use client";

import React from "react";
import { Locale } from "@churchapps/apphelper";
import { Element as AppHelperElement, ElementBlock, registerElementRenderer } from "@churchapps/apphelper/website";
import type { ChurchInterface } from "@churchapps/helpers";
import { ElementInterface, SectionInterface } from "@/helpers";
import { LiveStream } from "./video/LiveStream";
import { FormElement } from "./elements/FormElement";

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
  if (props.element.answers?.offlineContent === "hide") offlineContent = (props.editMode) ? (<>{Locale.label("element.offlinePlaceholder")}</>) : (<></>);
  else if (props.element.answers?.offlineContent === "block") offlineContent = <ElementBlock key={props.element.id} element={props.element as ElementInterface} churchSettings={props.churchSettings} textColor={"#333333"} />;

  return <LiveStream includeHeader={false} includeInteraction={includeInteraction} keyName={props.church.subDomain || ""} appearance={props.churchSettings} offlineContent={offlineContent} />;
};

// B1App-specific renderers registered as registry overrides; they win over the
// apphelper defaults regardless of module load order.
registerElementRenderer("stream", (p) => p.church
  ? <StreamElement element={p.element as ElementInterface} churchSettings={p.churchSettings} church={p.church} editMode={!!p.onEdit} />
  : null);
registerElementRenderer("form", (p) => p.church
  ? <FormElement element={p.element as ElementInterface} church={p.church} />
  : null);

export const Element: React.FC<Props> = (props) => <AppHelperElement {...props} />;
