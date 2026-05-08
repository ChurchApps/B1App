import { Alert, Grid, TextField, Typography } from "@mui/material";
import { ApiHelper } from "@churchapps/apphelper";
import { InputBox } from "@churchapps/apphelper";
import { Locale } from "@churchapps/apphelper";
import { Permissions } from "@churchapps/helpers";
import { UserHelper } from "@churchapps/apphelper";
import type { LinkInterface } from "@churchapps/helpers";
import { useForm } from "react-hook-form";

interface Props {
  groupId: string;
  saveCallback?: () => void;
  forGroupLeader?: boolean;
}

type AnyRecord = Record<string, any>;

export function GroupLinkAdd({ forGroupLeader = false, ...props }: Props) {
  const { register, handleSubmit, reset, setError, formState } = useForm<AnyRecord>({ defaultValues: { text: "", url: "" } });

  const e = formState.errors as any;
  const summaryErrors: string[] = [];
  if (e.text?.message) summaryErrors.push(e.text.message);
  if (e.url?.message) summaryErrors.push(e.url.message);
  if (e.root?.message) summaryErrors.push(e.root.message);

  const onValid = (values: AnyRecord) => {
    if (!UserHelper.checkAccess(Permissions.contentApi.content.edit)) {
      setError("root", { message: Locale.label("groups.validate.unauthorized") });
      return;
    }
    const category = forGroupLeader ? "groupLeaderLink" : "groupLink";
    const link: LinkInterface = { category: category, url: values.url, linkType: "url", text: values.text, linkData: props.groupId, icon: "" };
    ApiHelper.post("/links", [link], "ContentApi").then(() => {
      reset({ text: "", url: "" });
      props.saveCallback();
    });
  };

  return (
    <InputBox headerIcon="description" headerText={Locale.label("groups.addLinks")} saveFunction={handleSubmit(onValid)} saveText={Locale.label("groups.add")} data-testid="group-link-add-box">
      {summaryErrors.length > 0 && <Alert severity="error" sx={{ mb: 2 }} data-testid="group-link-errors">{summaryErrors.map((msg) => <div key={msg}>{msg}</div>)}</Alert>}
      <Typography sx={{ textIndent: 3, fontSize: "14px" }}>{Locale.label("groups.addLinksInfo")}</Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField fullWidth label={Locale.label("groups.linkText")} name="text" data-testid="group-link-text-input" aria-label={Locale.label("groups.linkTextLabel")} error={!!e.text} helperText={e.text?.message} {...register("text", { required: Locale.label("groups.validate.linkText") })} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField fullWidth label={Locale.label("groups.linkUrl")} name="url" data-testid="group-link-url-input" aria-label={Locale.label("groups.linkUrlLabel")} error={!!e.url} helperText={e.url?.message} {...register("url", { required: Locale.label("groups.validate.linkUrl") })} />
        </Grid>
      </Grid>
    </InputBox>
  );
}
