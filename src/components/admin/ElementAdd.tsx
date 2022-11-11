import { DisplayBox } from "@/appBase/components";
import React from "react";
import { AddableElement } from "./AddableElement";

type Props = {

};

export function ElementAdd(props: Props) {

  return (
    <>
      <DisplayBox id="elementAddBox" headerText="Add" headerIcon="article" >
        <p>Drag and drop onto page</p>
        <p>Todo: This box should hover/be fixed</p>
        <AddableElement dndType="section" elementType="section" icon="table_rows" label="Section" />
        <AddableElement dndType="element" elementType="row" icon="table_rows" label="Row" />
        <AddableElement dndType="column" elementType="column" icon="table_chart" label="Column" />
        <AddableElement dndType="element" elementType="text" icon="article" label="Text" />
        <AddableElement dndType="element" elementType="textWithPhoto" icon="photo" label="Text with Photo" />
      </DisplayBox>
    </>
  );
}