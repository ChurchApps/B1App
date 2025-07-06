"use client";

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
  minimal?: boolean
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

  let droppableStyle: CSSProperties = {
    position: "absolute", // Reverted
    top: 0, // Reverted
    left: 0, // Reverted
    width: "100%",
    height: 30,
    zIndex: 1, // Reverted
    border: "2px dashed #1976d2", // Default border for canDrop true
    backgroundColor: "transparent", // Default background for canDrop true and isOver false
    boxSizing: "border-box", // Ensure border is within height
    transition: "background-color 0.2s ease-in-out, border-color 0.2s ease-in-out",
    // Note: Text color transition will be handled by the Box/Icon sx prop if needed,
    // or by adding a transition to the parent div holding the text/icon if textColor was applied directly.
    // For now, focusing on background and border.
  };

  if (isOver) {
    droppableStyle.backgroundColor = "rgba(25, 118, 210, 0.1)"; // Highlight when hovered
  }

  if (props.minimal) {
    droppableStyle = { ...droppableStyle, height: 4, overflowY: "hidden" };
  }

  // Text color adjusted for better contrast with new backgrounds
  const textColor = "#1976d2";

  const getFullDisplay = () => (
    <>
      {props.children || props.text
        ? (
          // Added transition to the Box sx for smooth color change of text and icon
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mt: "4px", color: textColor, transition: "color 0.2s ease-in-out" }}>
            <Icon sx={{ marginRight: props.text ? "10px" : "auto" }}>add</Icon>
            <span>{props.text}</span>
          </Box>
        )
        // Added transition to the Icon sx for smooth color change
        : <Icon sx={{ color: textColor, transition: "color 0.2s ease-in-out" }}>add</Icon>}
    </>
  )

  const getMinimalDisplay = () => (
    <>&nbsp;</>
  )



  if (canDrop) return (
    <div style={{ position: "relative" }}>
      <div style={droppableStyle} ref={drop as any}> {/* Moved ref to the styled div itself */}
        <div style={{ textAlign: "center", width: "100%" }}> {/* Removed color: "#FFFFFF" */}
          {(props.minimal) ? getMinimalDisplay() : getFullDisplay()}
        </div>
      </div>
    </div>
  );
  else return <></>
}
