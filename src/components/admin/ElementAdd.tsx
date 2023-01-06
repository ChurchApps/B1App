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
        <p>Drag and drop onto page<br />
          <b>Simple Elements:</b></p>

        <Grid container spacing={3}>
          <AddableElement dndType="section" elementType="section" icon="table_rows" label="Section" />
          <AddableElement dndType="element" elementType="row" icon="reorder" label="Row" />
          <AddableElement dndType="column" elementType="column" icon="table_chart" label="Column" />
          <AddableElement dndType="element" elementType="text" icon="article" label="Text" />
          <AddableElement dndType="element" elementType="textWithPhoto" icon="photo" label="Text with Photo" />
          <AddableElement dndType="element" elementType="donation" icon="volunteer_activism" label="Donation" />


        </Grid>

        <p><b>Components:</b></p>
        <Grid container spacing={3}>
          <AddableElement dndType="elementTree" elementType="row" icon="table_chart" label="3 Columns with Text" />
        </Grid>
      </DisplayBox>
    </>
  );
}