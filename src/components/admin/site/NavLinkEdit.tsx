"use client";
import { useState, useEffect } from "react";
import { ErrorMessages, InputBox, ApiHelper, UserHelper, Permissions, LinkInterface } from "@churchapps/apphelper";
import { Dialog, Grid, SelectChangeEvent, TextField } from "@mui/material";

type Props = {
  link: LinkInterface;
  embedded?: boolean;
  updatedCallback: (link: LinkInterface) => void;
  onDone: () => void;
};

export function NavLinkEdit(props: Props) {
  const [link, setLink] = useState<LinkInterface>(props.link);
  const [errors, setErrors] = useState([]);

  const handleCancel = () => props.updatedCallback(link);
  const handleKeyDown = (e: React.KeyboardEvent<any>) => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } };

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    e.preventDefault();
    let l = { ...link };
    const val = e.target.value;
    switch (e.target.name) {
      case "linkText": l.text = val; break;
      case "linkUrl": l.url = val; break;
    }
    setLink(l);
  };

  const validate = () => {
    let errors = [];
    if (!UserHelper.checkAccess(Permissions.contentApi.content.edit)) errors.push("Unauthorized to create pages");
    setErrors(errors);
    return errors.length === 0;
  };


  const handleSave = async () => {
    if (validate()) {
      let linkData = link;

      if (link) {
        [linkData] = await ApiHelper.post("/links", [link], "ContentApi");
      }
      console.log("linkData", linkData);

      props.updatedCallback(linkData);
    }
  };

  const handleDelete = () => {
    let errors = [];
    if (!UserHelper.checkAccess(Permissions.contentApi.content.edit)) errors.push("Unauthorized to delete pages");

    if (errors.length > 0) {
      setErrors(errors);
      return ;
    }

    if (link) ApiHelper.delete("/links/" + link.id.toString(), "ContentApi").then(() => {console.log("DELETED"); props.updatedCallback(null)});

  };


  useEffect(() => { setLink(props.link); console.log("INIT LINK", props.link) }, [props.link]);

  if (!link) return <></>
  else return (
    <Dialog open={true} onClose={props.onDone} style={{minWidth:800}}>
      <InputBox id="pageDetailsBox" headerText={link?.id ? "Add Link" : "Link Settings"} headerIcon="article" saveFunction={handleSave} cancelFunction={handleCancel} deleteFunction={handleDelete} >
        <ErrorMessages errors={errors} />
        <Grid container spacing={2} style={{minWidth:500}}>
          <Grid item xs={6}>
            <TextField size="small" fullWidth label="Link Text" name="linkText" value={link.text} onChange={handleLinkChange} onKeyDown={handleKeyDown} />
          </Grid>
          <Grid item xs={6}>
            <TextField size="small" fullWidth label="Url" name="linkUrl" value={link.url} onChange={handleLinkChange} onKeyDown={handleKeyDown} />
          </Grid>
        </Grid>
      </InputBox>
    </Dialog>
  );
}
