"use client";

import { Box } from "@mui/material";
import { CSSProperties } from "@mui/material/styles/createMixins";
import React from "react";
import { useDrop } from 'react-dnd'

type Props = {
  direction: "up" | "down",
  text?: string
  dndDeps?: any

};

export function DroppableScroll(props: Props) {
  const [intervalId, setIntervalId] = React.useState(0);
  let steps = 0

  const [{ isOver, canDrop, item }, drop] = useDrop(
    () => ({
      accept: ["section", "sectionBlock", "element", "elementBlock"],
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
        item: monitor.getDropResult()
      }),
    }), [props?.dndDeps]
  );

  const scrollUp = () => {
    steps++;
    console.log("STEPS", steps);
    const newY = window.scrollY-50;
    if (newY < 0) clearInterval(intervalId);
    else window.scrollTo(0,newY);
    if (steps>100) handleMouseOut();
  }

  const scrollDown = () => {
    steps++;
    console.log("STEPS", steps);
    const newY = window.scrollY+50;
    window.scrollTo(0,newY);
    if (steps>100) handleMouseOut();
  }

  const handleMouseOver = () => {

    handleMouseOut();
    let id:any = setInterval((props.direction==="up") ? scrollUp : scrollDown, 50);
    setIntervalId(id as number);

  }

  const hardClear = () => {
    const id:any = setInterval(() => {}, 10000);
    for (let i = 0; i < id; i++) clearInterval(i);
    steps=0;
  }

  const handleMouseOut = () => {
    if (intervalId) { clearInterval(intervalId); steps=0;}
    else if (steps>=100) hardClear();

  }

  let droppableStyle:CSSProperties = { position: "absolute", top: 0, left: 0, height: 30, width: "100%", zIndex: 1, backgroundColor: (isOver) ? "#00FF00" : "#28a745" }


  if (canDrop) return (
    <div style={{ position: "relative" }}>
      <div style={droppableStyle}>
        <div style={{ textAlign: "center", color: "#FFFFFF", width: "100%" }} ref={drop as any}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mt: "4px" }} onDragEnter={handleMouseOver} onDragLeave={handleMouseOut} onDrop={handleMouseOut}>
            <span>{props.text}</span>
          </Box>
        </div>
      </div>
    </div>
  );
  else return <></>
}
