import { Icon, Box } from "@mui/material";
import { CSSProperties } from "@mui/material/styles/createMixins";
import React, { useEffect } from "react";
import { useDrop } from 'react-dnd'

type Props = {
  children?: React.ReactNode,
  accept: any,
  text?: string
  onDrop: (data: any) => void,
  dndDeps?: any,
  updateIsDragging?: (isDragging: boolean) => void
};

export function DroppableArea(props: Props) {

  const [isDragging, setIsDragging] = React.useState(false);

  const [{ isOver, canDrop, item }, drop] = useDrop(
    () => ({
      accept: props.accept,
      drop: (data) => props.onDrop(data),
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
        item: monitor.getDropResult()
      }),
    }), [props?.dndDeps]
  );

  if (canDrop!==isDragging) setIsDragging(canDrop);

  useEffect(() => { if (props.updateIsDragging) props.updateIsDragging(isDragging) }, [isDragging]);

  let droppableStyle:CSSProperties = { position: "absolute", top: 0, left: 0, height: 30, width: "100%", zIndex: 1, backgroundColor: (isOver) ? "#00FF00" : "#28a745" }

  if (canDrop) return (
    <div style={{ position: "relative" }}>
      <div style={droppableStyle}>
        <div style={{ textAlign: "center", color: "#FFFFFF", width: "100%" }} ref={drop}>
          {props.children || props.text
            ? (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mt: "4px" }}>
                <Icon sx={{ marginRight: props.text ? "10px" : "auto" }}>add</Icon>
                <span>{props.text}</span>
              </Box>
            )
            : <Icon>add</Icon>}
        </div>
      </div>
    </div>
  );
  else return <></>
}
