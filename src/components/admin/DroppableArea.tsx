import { Icon } from "@mui/material";
import React from "react";
import { useDrop } from 'react-dnd'

type Props = {
  children?: React.ReactNode,
  accept: any,
  onDrop: (data: any) => void
};

export function DroppableArea(props: Props) {

  const [{ isOver, canDrop, item }, drop] = useDrop(
    () => ({
      accept: props.accept,
      drop: (data) => props.onDrop(data),
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
        item: monitor.getDropResult()
      }),
    })
  );

  if (canDrop) return (
    <div style={{ height: 30, textAlign: "center", color: "#000099", width: "100%", backgroundColor: (isOver) ? "#00FF00" : "#CCCCCC" }} ref={drop}>
      {props.children || <Icon>add</Icon>}
    </div>
  );
  else return <div style={{ height: 30 }}></div>
}