import React, { useState } from "react";
import { useDrag } from "react-dnd";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

type Props = {
  children?: React.ReactNode;
  dndType: string;
  elementType?: string;
  data: any;
  onDoubleClick?: () => void;
};

export function DraggableWrapper(props: Props) {
  const dragRef = React.useRef(null);

  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: props.dndType,
      item: { elementType: props.elementType, data: props.data },
      collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
    }),
    [props.data]
  );

  drag(dragRef);

  const opacity = isDragging ? 0.5 : 1;

  return (
    <>
      {props.dndType === "section" || props.dndType === "element" ? (
        <div
          className="draggable-container"
          onDoubleClick={props.onDoubleClick}
          style={{ opacity, transition: "opacity 0.2s ease-in-out" }}
        >
          {/* Drag Handle - Always present and visible */}
          {(props.dndType === "section" || props.dndType === "element") && (
            <div
              className={`drag-handle ${props.dndType === "section" ? "section-handle" : ""}`}
              ref={dragRef}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "grab",
                padding: "4px", // Increased padding for a larger clickable area
                fontSize: "1.5rem", // Increased icon size
              }}
            >
              <DragIndicatorIcon fontSize="inherit" />
            </div>
          )}

          {/* Content - Fully selectable text */}
          <div className="draggable-content">{props.children}</div>
        </div>
      ) : (
        //Show old double click drag for site navigation, etc.
        <div
          ref={dragRef}
          style={{ opacity, transition: "opacity 0.2s ease-in-out" }}
          className="dragButton"
          onDoubleClick={props.onDoubleClick}
        >
          {props.children}
        </div>
      )}
    </>
  );
}
