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
    const newY = window.scrollY-50;
    if (newY < 0) clearInterval(intervalId);
    else window.scrollTo(0,newY);
  }

  const scrollDown = () => {
    const newY = window.scrollY+50;
    console.log("SCROLLING DOWN", newY, window.document.documentElement.clientHeight)
    //if (newY > window.document.documentElement.clientHeight) clearInterval(intervalId);
    //else window.scrollTo(0,newY);
    window.scrollTo(0,newY);
  }

  const handleMouseOver = () => {
    console.log("Mouse over!!!!")

    let id:any = setInterval((props.direction==="up") ? scrollUp : scrollDown, 50);
    setIntervalId(id as number);

  }

  const handleMouseOut = () => {
    console.log("CLEARING INTERVAL", intervalId)
    clearInterval(intervalId);
  }

  let droppableStyle:CSSProperties = { position: "absolute", top: 0, left: 0, height: 30, width: "100%", zIndex: 1, backgroundColor: (isOver) ? "#00FF00" : "#28a745" }


  if (canDrop) return (
    <div style={{ position: "relative" }}>
      <div style={droppableStyle}>
        <div style={{ textAlign: "center", color: "#FFFFFF", width: "100%" }} ref={drop}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mt: "4px" }} onDragEnter={handleMouseOver} onDragLeave={handleMouseOut}>
            <span>{props.text}</span>
          </Box>
        </div>
      </div>
    </div>
  );
  else return <></>
}
