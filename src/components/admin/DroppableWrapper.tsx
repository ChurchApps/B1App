import { CSSProperties } from "@mui/material/styles/createMixins";
import React, { useEffect } from "react";
import { useDrop } from 'react-dnd'

type Props = {
  children?: React.ReactNode,
  accept: any,
  onDrop: (data: any) => void,
  dndDeps?: any,
  updateIsDragging?: (isDragging: boolean) => void,
  hideWhenInactive?: boolean
};

export function DroppableWrapper(props: Props) {

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

  let droppableStyle: CSSProperties = {
    width: "100%",
    zIndex: 1,
    boxSizing: "border-box", // Added for consistency
    transition: "background-color 0.2s ease-in-out, border-color 0.2s ease-in-out", // Added transition
  };

  if (canDrop) {
    if (isOver) {
      droppableStyle.backgroundColor = "rgba(25,118,210, 1)";
      droppableStyle.outline = "2px solid #1976d2"; // Solid outline when actively hovered
      droppableStyle.outlineOffset = "-1px";
    } else {
      droppableStyle.backgroundColor = "rgba(25,118,210, 0.1)";
      droppableStyle.outline = "2px dashed #1976d2"; // Dashed outline when it's a droppable target but not hovered
      droppableStyle.outlineOffset = "-1px";
    }
  }
  // If not canDrop, no special background or border is applied, which is correct.

  if (canDrop) return (
    // The ref needs to be on the div that receives the style for the drop indication
    <div style={{ position: "relative" }}>
      <div style={droppableStyle} ref={drop as any}>
        <div style={{ width: "100%" }}>
          {props.children}
        </div>
      </div>
    </div>
  );
  else return (props.hideWhenInactive) ? <></> : <>{props.children}</>
}
