import { useState, useEffect } from "react";
import { ErrorMessages, InputBox, ApiHelper, UserHelper, Permissions, SlugHelper } from "@churchapps/apphelper";
import { PageInterface } from "@/helpers";
import { Button, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, SelectChangeEvent, Stack, TextField, Typography } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';

type Props = {
  page: PageInterface;
  embedded?: boolean;
  updatedCallback: (page: PageInterface) => void;
};

export function PageEdit(props: Props) {
  const [page, setPage] = useState<PageInterface>(null);
  const [errors, setErrors] = useState([]);
  const [checked, setChecked] = useState<boolean>();

  const handleCancel = () => props.updatedCallback(page);
  const handleKeyDown = (e: React.KeyboardEvent<any>) => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    e.preventDefault();
    let p = { ...page };
    const val = e.target.value;
    switch (e.target.name) {
      case "title": p.title = val; break;
      case "url": p.url = val.toLowerCase(); break;
      case "layout": p.layout = val; break;
    }
    setPage(p);
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

  const handleSave = () => {
    if (validate()) {
      ApiHelper.post("/pages", [page], "ContentApi").then((data) => {
        setPage(data);
        props.updatedCallback(data);
      });
    }
  };

  const handleDelete = () => {
    let errors = [];
    if (!UserHelper.checkAccess(Permissions.contentApi.content.edit)) errors.push("Unauthorized to delete pages");

    if (errors.length > 0) {
      setErrors(errors);
      return ;
    }

    if (window.confirm("Are you sure you wish to permanently delete this page?")) {
      ApiHelper.delete("/pages/" + page.id.toString(), "ContentApi").then(() => props.updatedCallback(null));
    }
  };

  const handleSlugValidation = () => {
    const p = { ...page };
    p.url = SlugHelper.slugifyString(p.url, "urlPath");
    setPage(p);
    setChecked(true);
  }

  useEffect(() => { setPage(props.page); if (props.page.url) { setChecked(true); } }, [props.page]);

  if (!page) return <></>
  else return (
    <>
      <InputBox id="pageDetailsBox" headerText="Edit Page" headerIcon="school" saveFunction={handleSave} cancelFunction={handleCancel} deleteFunction={handleDelete}>
        <ErrorMessages errors={errors} />
        <TextField fullWidth label="Title" name="title" value={page.title} onChange={handleChange} onKeyDown={handleKeyDown} />
        {checked
          ? (
            <div style={{ marginTop: "5px", paddingLeft: "4px" }}>
              <Paper elevation={0}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography>{page.url}</Typography>
                  <IconButton color="primary" onClick={() => setChecked(false)}><EditIcon /></IconButton>
                </Stack>
              </Paper>
              <div>
                <a href={`https://${UserHelper.currentUserChurch.church.subDomain}.b1.church${page.url}`} target="_blank" rel="noopener noreferrer">
                  {`https://${UserHelper.currentUserChurch.church.subDomain}.b1.church${page.url}`}
                </a>
              </div>
            </div>
          )
          : (
            <TextField fullWidth label="Url Path" name="url" value={page.url} onChange={handleChange} helperText="ex: /camper-registration  (**Make sure to check before saving)"
              InputProps={{ endAdornment: <Button variant="contained" color="primary" size="small" onClick={handleSlugValidation}>Check</Button> }}
            />
          )}
        {!props.embedded && (
          <FormControl fullWidth>
            <InputLabel>Layout</InputLabel>
            <Select fullWidth label="Layout" value={page.layout || ""} name="layout" onChange={handleChange}>
              <MenuItem value="headerFooter">Header & Footer</MenuItem>
              <MenuItem value="cleanCentered">Clean Centered Content</MenuItem>
            </Select>
          </FormControl>
        )}
      </InputBox>
    </>
  );
}
