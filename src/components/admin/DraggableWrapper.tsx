import React, { useState } from "react";
import { useDrag } from "react-dnd";

type Props = {
  children?: React.ReactNode;
  dndType: string;
  elementType?: string;
  data: any;
  onDoubleClick?: () => void;
};

export function DraggableWrapper(props: Props) {
  const dragRef = React.useRef(null);
  const [isHovered, setIsHovered] = useState(false);

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
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onDoubleClick={props.onDoubleClick}
          style={{ opacity }}
        >
          {/* Drag Handle - Always present but only visible on hover */}
          {(props.dndType === "section" || props.dndType === "element") && (
            <div className={`drag-handle ${props.dndType === "section" ? "section-handle" : ""}`} ref={dragRef} style={{ opacity: isHovered ? 1 : 0, transition: "opacity 0.2s" }}>
              <span>⠿</span>
            </div>
          )}

          {/* Content - Fully selectable text */}
          <div className="draggable-content">{props.children}</div>
        </div>
      ) : (
        //Show old double click drag for site navigation, etc.
        <div
          ref={dragRef}
          style={{ opacity }}
          className="dragButton"
          onDoubleClick={props.onDoubleClick}
        >
          {props.children}
        </div>
      )}
    </>
  );
}
