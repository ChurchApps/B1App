"use client";

import React from "react";

import { PersonInterface } from "@churchapps/helpers"
import { Locale, DisplayBox, PersonHelper } from "@churchapps/apphelper";
import { PersonAdd } from "./PersonAdd";

interface Props {
  addFunction: (person: PersonInterface) => void;
  person?: PersonInterface;
  getPhotoUrl: (person: PersonInterface) => string;
  searchClicked?: () => void;
  filterList?: string[];
  includeEmail?: boolean;
  actionLabel?: string;
  showCreatePersonOnNotFound?: boolean;
}

export const PersonAddAdvanced: React.FC<Props> = (props: Props) => {

  return <DisplayBox key="displayBox" id="personAddBox" headerIcon="person" headerText={Locale.label("Add Person")}>
    <PersonAdd getPhotoUrl={PersonHelper.getPhotoUrl} addFunction={props.addFunction} showCreatePersonOnNotFound />
  </DisplayBox>
}
