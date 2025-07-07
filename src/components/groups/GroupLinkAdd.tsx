import { useState } from "react";
import { Grid, TextField, Typography } from "@mui/material";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import { ErrorMessages } from "@churchapps/apphelper/dist/components/ErrorMessages";
import { InputBox } from "@churchapps/apphelper/dist/components/InputBox";
import { Permissions } from "@churchapps/helpers";
import { UserHelper } from "@churchapps/apphelper/dist/helpers/UserHelper";
import type { LinkInterface } from "@churchapps/helpers";

interface Props {
  groupId: string;
  saveCallback?: () => void;
  forGroupLeader?: boolean;
}

export function GroupLinkAdd({ forGroupLeader = false, ...props }: Props) {
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

    const category = forGroupLeader ? "groupLeaderLink" : "groupLink";
    const link: LinkInterface = { category: category, url: url, linkType: "url", text: text, linkData: props.groupId, icon: "" };
    ApiHelper.post("/links", [link], "ContentApi").then(() => {
      setText("");
      setUrl("");
      props.saveCallback();
    });
  };

  return (
    <InputBox headerIcon="description" headerText="Add Links" saveFunction={handleAdd} saveText="Add" data-testid="group-link-add-box">
      <ErrorMessages errors={errors} data-testid="group-link-errors" />
      <Typography sx={{ textIndent: 3, fontSize: "14px" }}>Link could be of Google Drive, Hosted Lesson PDF, etc.</Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField fullWidth label="Link Text" name="text" value={text} onChange={handleChange} data-testid="group-link-text-input" aria-label="Link display text" />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField fullWidth label="Link Url" name="url" value={url} onChange={handleChange} data-testid="group-link-url-input" aria-label="Link URL" />
        </Grid>
      </Grid>
    </InputBox>
  );
}
