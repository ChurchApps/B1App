import React from "react";
import { CSVLink } from "react-csv";
import { SmallButton } from "./SmallButton";

interface Props {
  data: any[],
  spaceAfter?: boolean,
  spaceBefore?: boolean,
  filename?: string
}

export const ExportLink: React.FC<Props> = (props) => {

  const getHeaders = () => {
    let result = [];
    if (props.data?.length > 0) {
      let names = getAllPropertyNames();
      for (let i = 0; i < names.length; i++) { result.push({ label: names[i], key: names[i] }); }
    }
    return result;
  }

  const getAllPropertyNames = () => {
    let result = [];
    for (let i = 0; i < props.data.length; i++) {
      let propertyNames = getPropertyNames("", props.data[i]);
      for (let j = 0; j < propertyNames.length; j++) if (result.indexOf(propertyNames[j]) === -1) result.push(propertyNames[j]);
    }
    return result.sort();
  }

  const getPropertyNames = (prefix: string, obj: any) => {
    let result = [];
    let names = Object.getOwnPropertyNames(obj)
    for (let i = 0; i < names.length; i++) {
      let t = typeof obj[names[i]];
      switch (t) {
        case "number":
        case "string":
        case "boolean":
          result.push(prefix + names[i]);
          break;
        case "object":
          if ((obj[names[i]] !== null)) {
            let children: string[] = getPropertyNames(prefix + names[i] + ".", obj[names[i]]);
            for (let j = 0; j < children.length; j++) result.push(children[j]);
          }
      }
    }
    return result;
  }

  if (!props.data || props.data?.length === 0) return null;
  else {
    let items = [];
    if (props.spaceBefore) items.push(" ");
    //items.push(<CSVLink key={props.filename} data={props.data} headers={getHeaders()} filename={props.filename || "export.csv"}> <Button><Icon>file_download</Icon></Button></CSVLink>);
    items.push(<CSVLink key={props.filename} data={props.data} headers={getHeaders()} filename={props.filename || "export.csv"}><SmallButton icon="file_download" /></CSVLink>);
    if (props.spaceAfter) items.push(" ");
    return (<>{items}</>);
  }
}
