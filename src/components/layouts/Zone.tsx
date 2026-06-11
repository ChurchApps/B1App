"use client";

import React from "react";
import { Section } from "@/components/Section";
import { SectionInterface } from "@/helpers";
import { ArrayHelper } from "@churchapps/apphelper";
import type { AppearanceInterface } from "@churchapps/apphelper";
import type { ChurchInterface } from "@churchapps/helpers";
import { SectionBlock } from "../SectionBlock";
import { SectionErrorBoundary } from "../SectionErrorBoundary";

type Props = {
  church: ChurchInterface,
  churchSettings: AppearanceInterface,
  sections: SectionInterface[],
  zone: string;
};

export default function Zone(props: Props) {
  const result: React.ReactElement[] = [];
  let first = true;
  const sections = ArrayHelper.getAll(props.sections, "zone", props.zone);

  sections.forEach((section, index) => {
    const key = `${section.id || index}-${props.zone}`;
    const content = section.targetBlockId
      ? <SectionBlock section={section} churchSettings={props.churchSettings} />
      : <Section section={section} first={first} church={props.church} churchSettings={props.churchSettings} />;
    result.push(<SectionErrorBoundary key={key}>{content}</SectionErrorBoundary>);
    first = false;
  });

  return <>{result}</>;
}
