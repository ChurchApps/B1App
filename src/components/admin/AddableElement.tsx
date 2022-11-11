import { CenterFocusStrong } from "@mui/icons-material";
import { Grid, Icon } from "@mui/material";
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
    <Grid item xs={4}>
      <div ref={dragRef} style={{ textAlign: "center", border: "1px solid #CCC", borderRadius: 5, paddingTop: 10, paddingBottom: 10, opacity }}>
        <Icon>{props.icon}</Icon><br />
        {props.label}
      </div>
    </Grid>
  );
}