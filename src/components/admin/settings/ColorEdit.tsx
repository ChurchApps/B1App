import { useState, useEffect } from "react";
import { TextField, SelectChangeEvent } from "@mui/material";
import {  ColorInterface } from "@/helpers";
import { InputBox, ApiHelper, UniqueIdHelper } from "@churchapps/apphelper";

interface Props {
  color: ColorInterface;
  updatedFunction?: () => void;
}

export function ColorEdit(props: Props) {
  const [color, setColor] = useState<ColorInterface>(null);

  useEffect(() => { setColor(props.color); }, [props.color]);

  const handleSave = () => { ApiHelper.post("/colors", [color], "ContentApi").then(props.updatedFunction); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const val = e.target.value;
    let c = { ...color };
    switch (e.target.name) {
      case "background": c.background = val; break;
      case "text": c.text = val; break;
      case "link": c.link = val; break;
      case "hover": c.hover = val; break;
      case "keyName": c.keyName = val; break;
    }
    setColor(c);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you wish to delete this color?")) {
      ApiHelper.delete("/colors/" + color.id, "ContentApi").then(() => {
        setColor(null);
        props.updatedFunction();
      });
    }
  };

  if (!color) return null;

  return (
    <>
      <InputBox headerIcon="folder" headerText="Edit Color" saveFunction={handleSave} cancelFunction={props.updatedFunction} deleteFunction={!UniqueIdHelper.isMissing(color?.id) ? handleDelete : null}>
        <TextField fullWidth label="Key Name" name="keyName" value={color.keyName} onChange={handleChange} />
      </InputBox>
    </>
  );
}
