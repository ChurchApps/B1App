"use client";

import React from "react";
import { SectionInterface } from "@/helpers";
import { Section } from "./Section";
import type { AppearanceInterface } from "@churchapps/helpers/dist/AppearanceHelper";


interface Props {
  first?: boolean,
  section: SectionInterface,
  churchId?: string;
  churchSettings: AppearanceInterface;
}

export const SectionBlock: React.FC<Props> = props => {

  const getSections = () => {
    const result: React.ReactElement[] = []
    props.section.sections.forEach(section => {
      result.push(<Section key={section.id} section={section} churchSettings={props.churchSettings} />)
    });
    return result;
  }

  return (<div style={{ minHeight: 30, position: "relative" }}>
    {getSections()}
  </div>);
}
