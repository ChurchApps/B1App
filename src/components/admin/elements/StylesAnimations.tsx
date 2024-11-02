import { InlineStylesInterface } from "@/helpers";
import React from "react";
import { StyleList } from "./StyleList";

interface Props {
  fields: string[],
  styles: InlineStylesInterface,
  onChange: (styles:any) => void;
}

export const StylesAnimations: React.FC<Props> = (props) => {
  const [showList, setShowList] = React.useState(props.styles && Object.keys(props.styles).length > 0);

  if (!showList) return <a href="about:blank" style={{marginTop:10, display:"block"}} onClick={(e) => {e.preventDefault(); setShowList(true)}}>Show Styles</a>;
  else return <>
    <a href="about:blank" style={{marginTop:10, display:"block"}} onClick={(e) => {e.preventDefault(); setShowList(false)}}>Hide Styles</a>

    <StyleList fields={props.fields} styles={props.styles} onChange={props.onChange} />
  </>
}
