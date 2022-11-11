import { Icon } from "@mui/material";
import React from "react";
import { useDrag } from 'react-dnd'

type Props = {
  dndType: string, elementType: string, icon: string, label: string
};

export function AddableElement(props: Props) {
  const dragRef = React.useRef(null)

  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: props.dndType,
      item: { elementType: props.elementType },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }),
    [],
  )

  drag(dragRef);

  const opacity = isDragging ? 0.5 : 1

  return (
    <div ref={dragRef} style={{ opacity }}>
      <Icon>{props.icon}</Icon>
      {props.label}
    </div>
  );
}