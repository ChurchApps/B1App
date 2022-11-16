import { Icon } from "@mui/material";
import React from "react";
import { useDrag } from 'react-dnd'

type Props = {
  dndType: string, elementType: string
};

export function DraggableIcon(props: Props) {
  const dragRef = React.useRef(null)

  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: props.dndType,
      item: { elementType: props.elementType },
      collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
    }),
    [],
  )

  drag(dragRef);

  const opacity = isDragging ? 0.5 : 1

  return (
    <div ref={dragRef} style={{ opacity, marginTop: -65 }}>
      <br />
      <br />
      <Icon>open_with</Icon><br />
    </div>
  );

  /*
  return (
    <div>
      <div ref={dragRef} className="dragButton" style={{ opacity }}>
        <Icon>open_with</Icon>
      </div>
    </div>
  );*/
}