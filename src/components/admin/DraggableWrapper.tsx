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
  const [isHovered, setIsHovered] = useState(false); // New state

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
      {props.dndType === "section" || props.dndType === "element"
        ? (
        <div
          className="draggable-container"
          onMouseEnter={() => setIsHovered(true)} // Added
          onMouseLeave={() => setIsHovered(false)} // Added
          onDoubleClick={props.onDoubleClick}
          style={{
            opacity,
            transition: "opacity 0.2s ease-in-out",
            position: "relative" // Ensure this is present
          }}
        >
          {/* Drag Handle - Now hover-triggered and absolutely positioned */}
          {(props.dndType === "section" || props.dndType === "element") && (
            <div
              className={`drag-handle ${props.dndType === "section" ? "section-handle" : ""}`}
              ref={dragRef}
              style={{
                display: "flex", // Keep in layout
                opacity: isHovered ? 1 : 0, // Control visibility with opacity
                pointerEvents: isHovered ? "auto" : "none", // Control interactivity
                transition: "opacity 0.2s ease-in-out", // Smooth fade
                position: "absolute",
                top: "5px",
                left: "5px",
                backgroundColor: "rgba(0, 0, 0, 0.5)", // Dark background
                color: "#fff", // White icon color
                padding: "8px", // Updated padding
                borderRadius: "4px", // Rounded corners
                alignItems: "center",
                justifyContent: "center",
                cursor: "grab",
                fontSize: "1.5rem", // For icon size
              }}
            >
              <DragIndicatorIcon fontSize="inherit" />
            </div>
          )}

          {/* Content - Fully selectable text */}
          <div className="draggable-content">{props.children}</div>
        </div>
      )
        : (
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
