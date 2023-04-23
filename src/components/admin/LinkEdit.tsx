import React, { useState } from "react";
import { TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { ApiHelper } from "../../appBase/helpers";
import { LinkInterface } from "../../appBase/interfaces";
import { InputBox, ErrorMessages } from "../../appBase/components";
import { Permissions, UserHelper } from "@/helpers";

interface Props {
  currentLink: LinkInterface,
  updatedFunction?: () => void,
  links: LinkInterface[],
}

export const LinkEdit: React.FC<Props> = (props) => {
  const [currentLink, setCurrentLink] = useState<LinkInterface>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [links, setLinks] = useState<LinkInterface[]>(null);
  const [subName, setSubName] = useState<string>(null);
  const [toggleSubName, setToggleSubName] = useState<boolean>(false);

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
    setSubName(e?.currentTarget?.innerText);
    let l = {...currentLink};
    l.parentId = val;
    setCurrentLink(l);
  }

  const handleSave = () => {
    let errors: string[] = [];
    if (!currentLink.text.trim()) errors.push("Please enter valid text");
    if (!currentLink.url.trim()) errors.push("Please enter link");
    if (!UserHelper.checkAccess(Permissions.contentApi.links.edit)) errors.push("Unauthorized to create links");

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
      <TextField fullWidth label="Text" name="text" type="text" value={currentLink?.text || ""} onChange={handleChange} />
      <TextField fullWidth label="Url" name="url" type="text" value={currentLink?.url || ""} onChange={handleChange} />
      {links?.length > 0 &&
        <>
          <div>
            {subName && toggleSubName === true
              ? <Typography fontSize="13px" marginTop={1} marginBottom={0.5}>This link is under submenu: <span style={{fontWeight: 800}}>{subName}</span></Typography>
              : <Typography fontSize="13px" marginTop={1} marginBottom={0.5}>Create this link inside submenu:</Typography>
            }
          </div>
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
              {links.map((link: LinkInterface) => (
                <ToggleButton
                  sx={{marginTop: 0.5}}
                  value={link.id}
                  size="small"
                  color="primary"
                  onClick={() => setToggleSubName(!toggleSubName)}
                >
                  {link.text}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </div>
        </>
      }
    </InputBox>
  );
}
