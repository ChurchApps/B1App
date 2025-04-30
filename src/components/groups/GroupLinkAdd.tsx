import { useState } from "react";
import { Grid, TextField, Typography } from "@mui/material";
import { ApiHelper, ErrorMessages, InputBox, LinkInterface, Permissions, UserHelper } from "@churchapps/apphelper";

interface Props {
  groupId: string;
  saveCallback?: () => void;
}

export function GroupLinkAdd(props: Props) {
  const [errors, setErrors] = useState<string[]>([]);
  const [text, setText] = useState<string>("");
  const [url, setUrl] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    switch (e.target.name) {
      case "text": setText(value); break;
      case "url": setUrl(value); break;
    }
  };

  const handleAdd = () => {
    const errors: string[] = [];
    if (!text.trim()) errors.push("Please enter valid text");
    if (!url.trim()) errors.push("Please enter link");
    if (!UserHelper.checkAccess(Permissions.contentApi.content.edit)) errors.push("Unauthorized to add links");

    if (errors.length > 0) {
      setErrors(errors);
      return;
    }

    const link: LinkInterface = { category: "groupLink", url: url, linkType: "url", text: text, linkData: props.groupId, icon: "" };
    ApiHelper.post("/links", [link], "ContentApi").then(() => {
      setText("");
      setUrl("");
      props.saveCallback();
    });
  };

  return (
    <InputBox headerIcon="description" headerText="Add Links" saveFunction={handleAdd} saveText="Add">
      <ErrorMessages errors={errors} />
      <Typography sx={{ textIndent: 3, fontSize: "14px" }}>Link could be of Google Drive, Hosted Lesson PDF, etc.</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Link Text" name="text" value={text} onChange={handleChange} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Link Url" name="url" value={url} onChange={handleChange} />
        </Grid>
      </Grid>
    </InputBox>
  );
}
