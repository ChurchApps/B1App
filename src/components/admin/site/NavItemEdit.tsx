import React, { useState } from "react";
import { TextField } from "@mui/material";
import { ApiHelper, LinkInterface, InputBox, ErrorMessages, UserHelper, Permissions } from "@churchapps/apphelper";
import { PageInterface } from "@/helpers";

interface Props {
  link: LinkInterface,
  page: PageInterface,
  updatedFunction?: () => void,
  links: LinkInterface[],
}

export const NavItemEdit: React.FC<Props> = (props) => {
  const [link, setLink] = useState<LinkInterface>(null);
  const [page, setPage] = useState<PageInterface>(null);

  const [errors, setErrors] = useState<string[]>([]);
  const [links, setLinks] = useState<LinkInterface[]>(null);
  //const [subName, setSubName] = useState<string>(null);
  //const [toggleSubName, setToggleSubName] = useState<boolean>(false);

  //const filteredGroupLinks = links && links.filter((link) => link.id !== currentLink.id);

  const handleDelete = () => {
    let errors: string[] = [];
    let i = 0;

    links.forEach(l => {
      if (link.id === l.parentId) {i++;}
    });

    if (!UserHelper.checkAccess(Permissions.contentApi.content.edit)) errors.push("Unauthorized to delete links");
    if (i > 0) errors.push("Delete nested links first");

    if (errors.length > 0) {
      setErrors(errors);
      return;
    }

    ApiHelper.delete("/links/" + link.id, "ContentApi").then(() => { setLink(null); props.updatedFunction(); });
  }
  const checkDelete = link?.id ? handleDelete : undefined;
  const handleCancel = () => { props.updatedFunction(); }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.currentTarget.value;
    let l = { ...link };
    switch (e.currentTarget.name) {
      case "text": l.text = val; break;
      case "url": l.url = val; break;
    }
    setLink(l);
  }

  const toggleChange = (e: React.MouseEvent<HTMLElement>, val: string | null) => {
    //setSubName(e?.currentTarget?.innerText);
    let l = {...link};
    l.parentId = val;
    setLink(l);
  }

  const handleSave = () => {
    let errors: string[] = [];
    if (!link.text.trim()) errors.push("Please enter valid text");
    if (!link.url.trim()) errors.push("Please enter link");
    if (!UserHelper.checkAccess(Permissions.contentApi.content.edit)) errors.push("Unauthorized to create links");

    if (errors.length > 0) {
      setErrors(errors);
      return;
    }

    ApiHelper.post("/links", [link], "ContentApi").then(() => props.updatedFunction());
  }

  React.useEffect(() => { setLink(props.link); }, [props.link]);
  React.useEffect(() => { setPage(props.page); }, [props.page]);
  React.useEffect(() => { setLinks(props.links); }, [props.links]);

  return (
    <InputBox headerIcon="link" headerText="Edit Link" saveFunction={handleSave} cancelFunction={handleCancel} deleteFunction={checkDelete} help="b1/streaming/header-links">
      <ErrorMessages errors={errors} />
      <TextField fullWidth label="Text" name="text" type="text" value={link?.text || ""} onChange={handleChange} />
      <TextField fullWidth label="Url" name="url" type="text" value={link?.url || ""} onChange={handleChange} />

    </InputBox>
  );
}

/*
{filteredGroupLinks?.length > 0
        && <>
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
              {filteredGroupLinks.map((link: LinkInterface) => (
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
        */
