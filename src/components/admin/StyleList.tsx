import { StyleOption } from "@/helpers";
import React from "react";
import { StyleEdit } from "./StyleEdit";

interface Props {
  fields: string[],
  styles: any,
  onChange: (styles:any) => void;
}

export const StyleList: React.FC<Props> = (props) => {
  const [showList, setShowList] = React.useState(false);
  const [editStyle, setEditStyle] = React.useState<{name:string, value:any}>(null);

  const allOptions:StyleOption[] = [
    { label: "Border Color", key: "border-color", type: "color", default: "#FF0000" },
    { label: "Border Radius", key: "border-radius", type: "px", default: "5" },
    { label: "Border Style", key: "border-style", type: "select", default: "solid", options: ["none", "solid", "dotted", "dashed", "double", "groove", "ridge", "inset", "outset"] },
    { label: "Border Width", key: "border-width", type: "px", default: "1" },
    { label: "Background Color", key: "background-color", type: "color", default: "#FF0000" },
    { label: "Color", key: "color", type: "color", default: "#FF0000" },
    { label: "Font Family", key: "font-family", type: "text", default: "Roboto" },
    { label: "Font Size", key: "font-size", type: "px", default: "14" },
    { label: "Font Style", key: "font-style", type: "select", default: "italic", options: ["normal", "italic"] },
    { label: "Height", key: "height", type: "px", default: 500 },
    { label: "Line Height", key: "line-height", type: "px", default: "14" },
    { label: "Margin", key: "margin", type: "px", default: 0 },
    { label: "Margin Left", key: "margin-left", type: "px", default: 0 },
    { label: "Margin Right", key: "margin-right", type: "px", default: 0 },
    { label: "Margin Top", key: "margin-top", type: "px", default: 0 },
    { label: "Margin Bottom", key: "margin-bottom", type: "px", default: 0 },
    { label: "Padding", key: "padding", type: "px", default: 0 },
    { label: "Padding Left", key: "padding-left", type: "px", default: 0 },
    { label: "Padding Right", key: "padding-right", type: "px", default: 0 },
    { label: "Padding Top", key: "padding-top", type: "px", default: 0 },
    { label: "Padding Bottom", key: "padding-nottom", type: "px", default: 0 },
    { label: "Width", key: "width", type: "px", default: 500 }
  ]

  const options:StyleOption[] = [];
  allOptions.forEach(o => {
    const base = o.key.split("-")[0];
    if (props.fields.indexOf(base) > -1) options.push(o);
  });

  const getCurrentStyles = () => {
    if (props.styles && Object.keys(props.styles).length > 0)
    {
      const result:JSX.Element[] = [];
      Object.keys(props.styles).forEach((key:string) => {
        const value = props.styles[key];
        const field = options.find(o => o.key === key);
        if (field) result.push(<div style={{marginBottom:5}}><a href="about:blank" style={{color:"#999", textDecoration:"underline"}} onClick={(e) => {e.preventDefault(); setEditStyle({name:key, value})}}>{field.label}: {value}</a></div>)
      })
      return result;

    } else return <p style={{fontSize:14}}>No styles have been added yet.</p>
  }

  const handleSave = (name:string, value:any) => {
    if (name) {
      const styles = (props.styles) ? {...props.styles} :  {};
      delete styles[name];
      if (value) styles[name] = value;
      console.log("****STYLES", props.styles, styles)
      props.onChange(styles);
    }
    setEditStyle(null);
  }


  if (!showList) return <a href="about:blank" style={{marginTop:10, display:"block"}} onClick={(e) => {e.preventDefault(); setShowList(true)}}>Show Style Editor</a>;
  else if (editStyle) return <StyleEdit style={editStyle} fieldOptions={options} onSave={handleSave} />
  else return <>
    <a href="about:blank" style={{marginTop:10, display:"block"}} onClick={(e) => {e.preventDefault(); setShowList(false)}}>Hide Style Editor</a>
    <hr />
    <p style={{color:"#999999", fontSize:12}}>Use these fields to customize the style of a single element.  For sitewide changes use the site appearance editor.</p>
    {getCurrentStyles()}
    <a href="about:blank" style={{marginTop:10, display:"block" }} onClick={(e) => {e.preventDefault(); setEditStyle({name:"", value:""})}}>Add a style</a>
  </>

}
