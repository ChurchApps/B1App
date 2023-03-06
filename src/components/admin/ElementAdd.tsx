import { DisplayBox } from "@/appBase/components/DisplayBox";
import { ApiHelper, ArrayHelper, BlockInterface, UserHelper } from "@/helpers";
import { Grid } from "@mui/material";
import React, { useEffect, useState } from "react";
import { AddableElement } from "./AddableElement";

type Props = {
  includeBlocks: boolean
  includeSection: boolean
};

export function ElementAdd(props: Props) {
  const [blocks, setBlocks] = useState<BlockInterface[]>([]);

  const loadData = () => { ApiHelper.get("/blocks", "ContentApi").then(b => setBlocks(b)); }

  useEffect(loadData, []);

  /*
     <p><b>Components:</b></p>
        <Grid container spacing={3}>
          <AddableElement dndType="elementBlock" elementType="row" icon="table_chart" label="3 Columns with Text" />
        </Grid> 
  */

  const Blocks = () => {
    let result: JSX.Element[] = []
    blocks.forEach((b) => {
      result.push(<AddableElement key={b.id} dndType={b.blockType} elementType="block" blockId={b.id} icon={(b.blockType === "elementBlock") ? "table_chart" : "reorder"} label={b.name} />);
    });
    return <Grid container spacing={1}>{result}</Grid>
  }

  return (
    <>
      <DisplayBox id="elementAddBox" headerText="Add" headerIcon="article" >
        <p>Drag and drop onto page<br />
          <b>Simple Elements:</b></p>

        <Grid container spacing={1}>
          {props.includeSection && (<AddableElement dndType="section" elementType="section" icon="table_rows" label="Section" />)}
          <AddableElement dndType="element" elementType="row" icon="reorder" label="Row" />
          <AddableElement dndType="element" elementType="text" icon="article" label="Text" />
          <AddableElement dndType="element" elementType="textWithPhoto" icon="photo" label="Text with Photo" />
          <AddableElement dndType="element" elementType="card" icon="badge" label="Card" />
          <AddableElement dndType="element" elementType="logo" icon="home_app_logo" label="Logo" />
          <AddableElement dndType="element" elementType="iframe" icon="crop_free" label="Embed Page" />
          <AddableElement dndType="element" elementType="buttonLink" icon="smart_button" label="Button" />
          <AddableElement dndType="element" elementType="donation" icon="volunteer_activism" label="Donation" />
          <AddableElement dndType="element" elementType="stream" icon="live_tv" label="Stream" />
          <AddableElement dndType="element" elementType="video" icon="play_circle" label="Video" />
          <AddableElement dndType="element" elementType="rawHTML" icon="code" label="HTML" />
        </Grid>

        {props.includeBlocks && (<>
          <p><b>Blocks:</b></p>
          <Blocks />
        </>)}
      </DisplayBox>
    </>
  );
}