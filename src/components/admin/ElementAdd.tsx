import React, { useEffect, useState } from "react";
import { Grid, Accordion, AccordionSummary, Typography, AccordionDetails } from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { DisplayBox, ApiHelper } from "@churchapps/apphelper";
import { BlockInterface } from "@/helpers";
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
    return <Grid container spacing={1}>{result.length > 0 ? result : <p>No blocks found</p>}</Grid>
  }

  //<AddableElement dndType="element" elementType="buttonLink" icon="smart_button" label="Button" />
  return (
    <>
      <DisplayBox id="elementAddBox" headerText="Add" headerIcon="article">
        <p>Drag and drop onto page<br /></p>
        <Accordion sx={{ mt: 2 }}>
          <AccordionSummary
            expandIcon={<ExpandMore />}
          >
            <Typography>Simple Elements</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing="1">
              {props.includeSection && (<AddableElement dndType="section" elementType="section" icon="table_rows" label="Section" />)}
              <AddableElement dndType="element" elementType="row" icon="reorder" label="Row" />
              <AddableElement dndType="element" elementType="text" icon="article" label="Text" />
              <AddableElement dndType="element" elementType="textWithPhoto" icon="photo" label="Text with Photo" />
              <AddableElement dndType="element" elementType="card" icon="badge" label="Card" />
              <AddableElement dndType="element" elementType="iframe" icon="crop_free" label="Embed Page" />
              <AddableElement dndType="element" elementType="rawHTML" icon="code" label="HTML" />
              <AddableElement dndType="element" elementType="video" icon="play_circle" label="Video" />
              <AddableElement dndType="element" elementType="faq" icon="quiz" label="Expandable" />
              <AddableElement dndType="element" elementType="map" icon="add_location_alt" label="Location" />
              <AddableElement dndType="element" elementType="carousel" icon="view_carousel" label="Carousel" />
              <AddableElement dndType="element" elementType="image" icon="add_photo_alternate" label="Image" />
              <AddableElement dndType="element" elementType="whiteSpace" icon="rectangle" label="White Space" />
            </Grid>
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMore />}
          >
            <Typography>Church Specific</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing="1">
              <AddableElement dndType="element" elementType="logo" icon="home_app_logo" label="Logo" />
              <AddableElement dndType="element" elementType="donation" icon="volunteer_activism" label="Donation" />
              <AddableElement dndType="element" elementType="stream" icon="live_tv" label="Stream" />
              <AddableElement dndType="element" elementType="form" icon="format_align_left" label="Form" />
              <AddableElement dndType="element" elementType="sermons" icon="video_library" label="Sermons" />
              <AddableElement dndType="element" elementType="calendar" icon="calendar_month" label="Calendar" />
            </Grid>
          </AccordionDetails>
        </Accordion>
        {props.includeBlocks && (
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMore />}
            >
              <Typography>Blocks</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Blocks />
            </AccordionDetails>
          </Accordion>
        )}
      </DisplayBox>
    </>
  );
}
