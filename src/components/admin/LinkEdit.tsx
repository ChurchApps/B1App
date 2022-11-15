import { TextField } from "@mui/material";
import React, { useState } from "react";

import { ApiHelper } from "../../appBase/helpers";
import { LinkInterface } from "../../appBase/interfaces";
import { InputBox, ErrorMessages } from "../../appBase/components";

interface Props { currentLink: LinkInterface, updatedFunction?: () => void }

export const LinkEdit: React.FC<Props> = (props) => {
  const [currentLink, setCurrentLink] = useState<LinkInterface>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const handleDelete = () => { ApiHelper.delete("/links/" + currentLink.id, "ContentApi").then(() => { setCurrentLink(null); props.updatedFunction(); }); }
  const checkDelete = currentLink?.id ? handleDelete : undefined;
  const handleCancel = () => { props.updatedFunction(); }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.currentTarget.value;
    let l = { ...currentLink };
    switch (e.currentTarget.name) {
      case "text": l.text = val; break;
      case "url": l.url = val; break;
    }
    setCurrentLink(l);
  }

  const handleSave = () => {
    let errors: string[] = [];
    if (!currentLink.text.trim()) errors.push("Please enter valid text");
    if (!currentLink.url.trim()) errors.push("Please enter link");

    if (errors.length > 0) {
      setErrors(errors);
      return;
    }

    ApiHelper.post("/links", [currentLink], "ContentApi").then(() => props.updatedFunction());
  }

  React.useEffect(() => { setCurrentLink(props.currentLink); }, [props.currentLink]);

  return (
    <InputBox headerIcon="link" headerText="Edit Link" saveFunction={handleSave} cancelFunction={handleCancel} deleteFunction={checkDelete} help="streaminglive/header-links">
      <ErrorMessages errors={errors} />
      <TextField fullWidth label="Text" name="text" type="text" value={currentLink?.text || ""} onChange={handleChange} />
      <TextField fullWidth label="Url" name="url" type="text" value={currentLink?.url || ""} onChange={handleChange} />
    </InputBox>
  );
}
