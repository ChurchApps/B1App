import { DisplayBox } from "@/appBase/components/DisplayBox";
import { Grid } from "@mui/material";
import React from "react";
import { AddableElement } from "./AddableElement";
import { DraggableIcon } from "./DraggableIcon";

type Props = {

};

export function ElementAdd(props: Props) {

  return (
    <>
      <DisplayBox id="elementAddBox" headerText="Add" headerIcon="article" >
        <p>Drag and drop onto page</p>
        <DraggableIcon dndType="section" elementType="section" data={{}} />
        <br />

        <Grid container spacing={3}>
          <AddableElement dndType="section" elementType="section" icon="table_rows" label="Section" />
          <AddableElement dndType="element" elementType="row" icon="reorder" label="Row" />
          <AddableElement dndType="column" elementType="column" icon="table_chart" label="Column" />
          <AddableElement dndType="element" elementType="text" icon="article" label="Text" />
          <AddableElement dndType="element" elementType="textWithPhoto" icon="photo" label="Text with Photo" />
        </Grid>
      </DisplayBox>
    </>
  );
}