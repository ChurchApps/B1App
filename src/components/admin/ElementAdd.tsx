import { DisplayBox } from "@/appBase/components";
import React from "react";
import { AddableElement } from "./AddableElement";

type Props = {

};

export function ElementAdd(props: Props) {

  return (
    <>
      <DisplayBox id="elementAddBox" headerText="Add" headerIcon="article" >
        <AddableElement index={0} key="section" icon="table_rows" label="Section" />
        <AddableElement index={1} key="row" icon="table_rows" label="Row" />
        <AddableElement index={2} key="column" icon="table_chart" label="Column" />
        <AddableElement index={3} key="text" icon="article" label="Text" />
        <AddableElement index={4} key="textWithImage" icon="photo" label="Text with Image" />
      </DisplayBox>
    </>
  );
}