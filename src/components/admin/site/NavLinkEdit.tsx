"use client";
import { useState, useEffect, SyntheticEvent } from "react";
import { ErrorMessages, InputBox, ApiHelper, UserHelper, Permissions, LinkInterface } from "@churchapps/apphelper";
import { Autocomplete, Dialog, SelectChangeEvent, TextField } from "@mui/material";
import { PageLink } from "@/helpers";
import { PageHelper } from "@/helpers/PageHelper";

type Props = {
  link: LinkInterface;
  embedded?: boolean;
  updatedCallback: (link: LinkInterface) => void;
  onDone: () => void;
};

export function NavLinkEdit(props: Props) {
  const [link, setLink] = useState<LinkInterface>(props.link);
  const [errors, setErrors] = useState([]);
  const [pageTree, setPageTree] = useState<PageLink[]>([]);

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

  const handleUrlChange = (e: SyntheticEvent<Element, Event>, value: string) => {
    e?.preventDefault();
    let l = { ...link };
    l.url = value;
    setLink(l);
  }

  const validate = () => {
    let errors = [];
    if (!UserHelper.checkAccess(Permissions.contentApi.content.edit)) errors.push("Unauthorized to create pages");
    if (!link?.text || link?.text === "" || link?.text?.trim().length === 0) errors.push("Please enter link text");
    setErrors(errors);
    return errors.length === 0;
  };


  const handleSave = async () => {
    if (validate()) {
      let linkData = link;

      if (link) {
        [linkData] = await ApiHelper.post("/links", [link], "ContentApi");
      }

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

    if (link) ApiHelper.delete("/links/" + link.id.toString(), "ContentApi").then(() => { props.updatedCallback(null)});

  };

  const getPageOptions = () => {
    let options:string[] = [];
    pageTree.forEach((p) => {
      options.push(p.url);
    });
    return options;
  }

  useEffect(() => { setLink(props.link); }, [props.link]);
  useEffect(() => { PageHelper.loadPageTree().then((data) => { setPageTree(PageHelper.flatten(data)); }); }, []);


  if (!link) return <></>
  else return (
    <Dialog open={true} onClose={props.onDone} style={{minWidth:800}}>
      <InputBox id="pageDetailsBox" headerText={link?.id ? "Add Link" : "Link Settings"} headerIcon="article" saveFunction={handleSave} cancelFunction={handleCancel} deleteFunction={handleDelete}>
        <ErrorMessages errors={errors} />
        <Autocomplete disablePortal limitTags={3} freeSolo options={getPageOptions()} onChange={handleUrlChange} onInputChange={handleUrlChange} sx={{ width: 300 }} ListboxProps={{ style: { maxHeight:150 }}} value={link.url} renderInput={(params) =>
          <TextField {...params} size="small" fullWidth label="Url" name="linkUrl" onKeyDown={handleKeyDown} />
        } />
        <TextField size="small" fullWidth label="Link Text" name="linkText" value={link.text || ""} onChange={handleLinkChange} onKeyDown={handleKeyDown} />
      </InputBox>
    </Dialog>
  );
}
