import { StyleOption } from "@/helpers";
import { InputBox } from "@churchapps/apphelper";
import { FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import React, { useEffect } from "react";
import { ColorPicker } from "./ColorPicker";

interface Props {
  fieldOptions: StyleOption[],
  style: {platform:string, name:string, value:any},
  onSave: (platform:string, name:string, value:any) => void;
}


export const StyleEdit: React.FC<Props> = (props) => {

  const [name, setName] = React.useState(props.style.name || props.fieldOptions[0].key);
  const [value, setValue] = React.useState(props.style.value || props.fieldOptions[0].default);

  const getInputField = () => {
    let result = <></>;
    const field = props.fieldOptions.find(o => o.key === name);
    switch (field.type) {
      case "text":
        result = <TextField fullWidth size="small" label={field.label} name="value" value={value} onChange={(e:any) => { setValue(e.target.value) }}  />
        break;
      case "select":
        result = <FormControl fullWidth>
          <InputLabel>{field.label}</InputLabel>
          <Select size="small" fullWidth label={field.label} name="value" value={value} onChange={(e) => { setValue(e.target.value) }}>
            {field.options.map(o => <MenuItem value={o}>{o}</MenuItem>)}
          </Select>
        </FormControl>
        break;
      case "px":
        result = <TextField fullWidth size="small" label={field.label + " - px"} name="value" value={value} onChange={(e:any) => { setValue(e.target.value) }} type="number" />
        break;
      case "color":
        result = <ColorPicker color={value} updatedCallback={(c) => setValue(c)} globalStyles={null} />
        break;
    }
    return result;
  }

  useEffect(() => {
    if (name===props.style.name) setValue(props.style.value);
    else setValue(props.fieldOptions.find(o => o.key === name).default);
  }, [name]);

  return <InputBox saveFunction={() => { props.onSave(props.style.platform, name, value) }} saveText="Update" headerText="Edit Style" cancelFunction={() => { props.onSave("", "", "") }} deleteFunction={(props.style.name) ? () => { props.onSave(props.style.platform, props.style.name, null )} : null}>
    <FormControl fullWidth>
      <InputLabel>Property</InputLabel>
      <Select size="small" fullWidth label="Property" name="name" value={name} onChange={(e) => {setName(e.target.value)}}>
        {props.fieldOptions.map(o => <MenuItem value={o.key}>{o.label}</MenuItem>)}
      </Select>
    </FormControl>
    {getInputField()}
  </InputBox>

}
