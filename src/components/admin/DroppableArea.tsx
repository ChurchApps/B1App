import React from "react";
import { useDrop } from 'react-dnd'

type Props = {

};

export function DroppableArea(props: Props) {
  const DND_ITEM_TYPE = 'row';

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: DND_ITEM_TYPE,
      collect: (monitor) => ({
        isOver: !!monitor.isOver()
      }),
    })
  );

  return (
    <div style={{ height: 200, width: "100%", backgroundColor: (isOver) ? "#00FF00" : "#FF0000" }} ref={drop}>
      Drop Here
    </div>
  );
}