import { AnimationsInterface, InlineStylesInterface } from "@/helpers";
import React from "react";
import { StyleList } from "./StyleList";
import { AnimationsEdit } from "./AnimationsEdit";

interface Props {
  fields: string[],
  styles: InlineStylesInterface,
  animations: AnimationsInterface,
  onStylesChange: (styles:any) => void;
  onAnimationsChange: (animations:AnimationsInterface | null) => void;
}

export const StylesAnimations: React.FC<Props> = (props) => {
  const [showStyles, setShowStyles] = React.useState(props.styles && Object.keys(props.styles).length > 0);
  const [showAnimations, setShowAnimations] = React.useState(props.animations && Object.keys(props.animations).length > 0);

  return <>
    <div style={{marginTop:10}}>
      <a href="about:blank" onClick={(e) => {e.preventDefault(); setShowStyles(!showStyles)}}>{showStyles ? "Hide" : "Show"} Styles</a>
    &nbsp; | &nbsp;
      <a href="about:blank" onClick={(e) => {e.preventDefault(); setShowAnimations(!showAnimations)}}>{showAnimations ? "Hide" : "Show"} Animation</a>
    </div>
    {showStyles && <StyleList fields={props.fields} styles={props.styles} onChange={props.onStylesChange} />}
    {showAnimations && <AnimationsEdit animations={props.animations} onSave={(animations) => { setShowAnimations(false); props.onAnimationsChange(animations); }} />}
  </>

}
