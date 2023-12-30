import { StyleOption, allStyleOptions } from "@/helpers";
import React from "react";
import { StyleEdit } from "./StyleEdit";

interface Props {
  fields: string[],
  styles: any,
  onChange: (styles:any) => void;
}

export const StyleList: React.FC<Props> = (props) => {
  const [showList, setShowList] = React.useState(props.styles && Object.keys(props.styles).length > 0);
  const [editStyle, setEditStyle] = React.useState<{name:string, value:any}>(null);



  const options:StyleOption[] = [];
  allStyleOptions.forEach(o => {
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
