"use client";
import { useState, useEffect } from "react";
import { ErrorMessages, InputBox, ApiHelper, UserHelper, Permissions, SlugHelper, LinkInterface } from "@churchapps/apphelper";
import { TemplateHelper } from "@/helpers/TemplateHelper";
import { PageInterface } from "@/helpers";
import { Button, Dialog, FormControl, Grid, IconButton, InputLabel, MenuItem, Paper, Select, SelectChangeEvent, Stack, TextField, Typography } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';

type Props = {
  page: PageInterface;
  link: LinkInterface;
  embedded?: boolean;
  updatedCallback: (page: PageInterface, link: LinkInterface) => void;
  onDone: () => void;
};

export function PageLinkEdit(props: Props) {
  const [page, setPage] = useState<PageInterface>(null);
  const [link, setLink] = useState<LinkInterface>(null);
  const [errors, setErrors] = useState([]);
  const [checked, setChecked] = useState<boolean>();
  const [pageTemplate, setPageTemplate] = useState<string>("blank");
  const [showPageTemplate, setShowPageTemplate] = useState<boolean>(true);

  const handleCancel = () => props.updatedCallback(page, link);
  const handleKeyDown = (e: React.KeyboardEvent<any>) => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    e.preventDefault();
    let p = { ...page };
    const val = e.target.value;
    switch (e.target.name) {
      case "title": p.title = val; break;
      case "url":
        p.url = val.toLowerCase();
        if (link) {
          let l = { ...link };
          l.url = val.toLowerCase();
          setLink(l);
        }
        break;
      case "layout": p.layout = val; break;
    }
    setPage(p);
  };

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
    if (!page.url || page.url === "") errors.push("Please enter a path.");
    if (!page.title || page.title === "") errors.push("Please enter a title.");
    if (!UserHelper.checkAccess(Permissions.contentApi.content.edit)) errors.push("Unauthorized to create pages");
    if (!checked) errors.push("Please check Url Path");
    setErrors(errors);
    return errors.length === 0;
  };

  const createTemplate = async(type: string, pageId: string) => {
    switch (type) {
      case "blank": ; break;
      case "sermons": await TemplateHelper.createSermonsPage(pageId); break;
      case "about": await TemplateHelper.createAboutUsPage(pageId); break;
      case "donate": await TemplateHelper.createDonatePage(pageId); break;
      case "location": await TemplateHelper.createVisitPage(pageId); break;
    }
  }

  const handleSave = async () => {
    if (validate()) {
      let pageData = page;
      let linkData = link;

      [pageData] = await ApiHelper.post("/pages", [page], "ContentApi");


      if (link) {
        [linkData] = await ApiHelper.post("/links", [link], "ContentApi");
      }

      setPage(pageData);
      await createTemplate(pageTemplate, pageData.id);
      props.updatedCallback(pageData, linkData);
    }
  };

  const handleDelete = () => {
    let errors = [];
    if (!UserHelper.checkAccess(Permissions.contentApi.content.edit)) errors.push("Unauthorized to delete pages");

    if (errors.length > 0) {
      setErrors(errors);
      return ;
    }

    if (page) {
      if (window.confirm("Are you sure you wish to permanently delete this page?")) {
        ApiHelper.delete("/pages/" + page.id.toString(), "ContentApi").then(() => {
          if (link) ApiHelper.delete("/links/" + link.id.toString(), "ContentApi").then(() => props.updatedCallback(null, null));
          else props.updatedCallback(null, link)
        });
      }
    } else {
      if (link) ApiHelper.delete("/links/" + link.id.toString(), "ContentApi").then(() => props.updatedCallback(null, null));

    }

  };

  const handleSlugValidation = () => {
    const p = { ...page };
    p.url = SlugHelper.slugifyString(p.url, "urlPath");
    setPage(p);
    setChecked(true);
  }

  const handleDuplicate = (e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm("Are you sure you wish to make a copy of this page and all of it's contents?")) {
      ApiHelper.post("/pages/duplicate/" + page.id, {}, "ContentApi").then((data) => {
        setPage(null);
        props.updatedCallback(data, link);
      });
    }
  }


  useEffect(() => {
    setPage(props.page);
    setLink(props.link);
    if (props.page?.url) { setChecked(true); };
    if (props.page && Object.keys(props.page).length > 0) { setShowPageTemplate(false) };
  }, [props.page, props.link]);

  if (!page && !link) return <></>
  else return (
    <Dialog open={true} onClose={props.onDone} style={{minWidth:800}}>
      <InputBox id="pageDetailsBox" headerText={page ? "Page Settings" : "Link Settings"} headerIcon="article" saveFunction={handleSave} cancelFunction={handleCancel} deleteFunction={handleDelete} headerActionContent={(page?.id && <a href="about:blank" onClick={handleDuplicate}>Duplicate</a>)}>
        <ErrorMessages errors={errors} />
        <Grid container spacing={2} style={{minWidth:500}}>
          {page && <Grid item xs={6}>
            <TextField size="small" fullWidth label="Page Title" name="title" value={page.title} onChange={handleChange} onKeyDown={handleKeyDown} />
          </Grid>
          }
          {link && <Grid item xs={6}>
            <TextField size="small" fullWidth label="Link Text" name="linkText" value={link.text} onChange={handleLinkChange} onKeyDown={handleKeyDown} />
          </Grid>
          }
          {page && <Grid item xs={6}>
            {!props.embedded && (
              <FormControl fullWidth size="small">
                <InputLabel>Layout</InputLabel>
                <Select size="small" fullWidth label="Layout" value={page.layout || ""} name="layout" onChange={handleChange}>
                  <MenuItem value="headerFooter">Header & Footer</MenuItem>
                  <MenuItem value="cleanCentered">Clean Centered Content</MenuItem>
                </Select>
              </FormControl>
            )}
          </Grid>
          }
          {page && <Grid item xs={6}>
            {checked
              ? (
                <div style={{ marginTop: "5px", paddingLeft: "4px" }}>
                  <Paper elevation={0}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography>{page.url}</Typography>
                      <IconButton color="primary" onClick={() => setChecked(false)}><EditIcon /></IconButton>
                    </Stack>
                  </Paper>
                </div>
              )
              : (
                <TextField size="small" fullWidth label="Url Path" name="url" value={page.url} onChange={handleChange} helperText="ex: /camper-registration  (**Make sure to check before saving)"
                  InputProps={{ endAdornment: <Button variant="contained" color="primary" size="small" onClick={handleSlugValidation}>Check</Button> }}
                />
              )}
          </Grid>
          }
          {!page && link && <Grid item xs={6}>
            <TextField size="small" fullWidth label="Url" name="linkUrl" value={link.url} onChange={handleLinkChange} onKeyDown={handleKeyDown} />
          </Grid>
          }
        </Grid>




        {page && !props.embedded && showPageTemplate === true && (
          <FormControl fullWidth>
            <InputLabel>Page Template</InputLabel>
            <Select fullWidth label="Page Template" name="pageTemplate" value={pageTemplate} onChange={(e) => setPageTemplate(e.target.value)}>
              <MenuItem value="blank">Blank</MenuItem>
              <MenuItem value="sermons">Sermons</MenuItem>
              <MenuItem value="about">About Us</MenuItem>
              <MenuItem value="donate">Donate</MenuItem>
              <MenuItem value="location">Location</MenuItem>
            </Select>
          </FormControl>
        )}
      </InputBox>
    </Dialog>
  );
}
