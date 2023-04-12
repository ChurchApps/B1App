import React, { useState } from "react";
import { TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { ApiHelper } from "../../appBase/helpers";
import { LinkInterface } from "../../appBase/interfaces";
import { InputBox, ErrorMessages } from "../../appBase/components";

interface Props {
  currentLink: LinkInterface,
  updatedFunction?: () => void,
  links: LinkInterface[],
}

export const LinkEdit: React.FC<Props> = (props) => {
  const [currentLink, setCurrentLink] = useState<LinkInterface>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [links, setLinks] = useState<LinkInterface[]>(null);

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

  const toggleChange = (e: React.MouseEvent<HTMLElement>, val: string | null) => {
    let l = {...currentLink};
    l.parentId = val;
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
  React.useEffect(() => { setLinks(props.links); }, [props.links]);

  return (
    <InputBox headerIcon="link" headerText="Edit Link" saveFunction={handleSave} cancelFunction={handleCancel} deleteFunction={checkDelete} help="streaminglive/header-links">
      <ErrorMessages errors={errors} />
      <div>
        <ToggleButtonGroup
          exclusive
          value={currentLink?.parentId}
          onChange={toggleChange}
          sx={{
            display: "flex",
            flexWrap: "wrap",
          }}
        >
          {links?.map((link: LinkInterface) => (
            <ToggleButton
              sx={{marginTop: 0.5}}
              value={link.id}
              size="small"
              color="primary"
            >
              {link.text}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>
      <TextField fullWidth label="Text" name="text" type="text" value={currentLink?.text || ""} onChange={handleChange} />
      <TextField fullWidth label="Url" name="url" type="text" value={currentLink?.url || ""} onChange={handleChange} />
    </InputBox>
  );
}
