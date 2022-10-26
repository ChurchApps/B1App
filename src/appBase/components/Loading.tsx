import React from "react";
import { Dots } from "react-activity";
import "react-activity/dist/library.css";

interface Props { size?: "sm" | "md" | "lg", loadingText?: string, color?: string }

export const Loading: React.FC<Props> = (props) => {

  const getContents = () => {
    const text = (props.loadingText) ? props.loadingText : "Loading"
    const color = (props.color) ? props.color : "#222"
    let result = <><Dots speed={0.8} animating={true} size={32} color={color} /><p style={{ color: color }}>{text}</p></>
    switch (props.size) {
      case "sm":
        result = <><Dots speed={0.8} animating={true} size={20} color={color} /><p style={{ fontSize: 12, color: color }}>{text}</p></>
        break;
      case "lg":
        result = <><Dots speed={0.8} animating={true} size={48} color={color} /><p style={{ fontSize: 30, color: color }}>{text}</p></>
        break;
    }
    return result;
  }

  return (
    <div style={{ textAlign: "center", fontFamily: "Roboto" }}>
      {getContents()}
    </div>
  )
}
