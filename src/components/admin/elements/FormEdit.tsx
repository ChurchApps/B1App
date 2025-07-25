import { useEffect, useState } from "react";
import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Typography, Link } from "@mui/material";
import { Loading } from "@churchapps/apphelper/dist/components/Loading";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import type { FormInterface } from "@churchapps/helpers";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";

type Props = {
  parsedData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement> | SelectChangeEvent<string>) => void;
};

export const FormEdit = ({ parsedData, handleChange }: Props) => {
  const [forms, setForms] = useState<FormInterface[]>(null);

  useEffect(() => {
    ApiHelper.get("/forms", "MembershipApi").then((data) => setForms(data));
  }, []);

  const standaloneForms = forms?.filter((form) => form.contentType === "form");

  if (!standaloneForms) {
    return <Loading />;
  }

  if (standaloneForms?.length === 0) {
    return (
      <Typography fontSize="15px" fontStyle="italic" align="center">
        No forms available!
        <br />
        <Link
          href={`${EnvironmentHelper.Common.ChumsRoot}/forms`}
          target="_blank"
          rel="noreferrer"
        >
          Create a new form
        </Link>
      </Typography>
    );
  }

  return (
    <>
      <FormControl fullWidth>
        <InputLabel>Select</InputLabel>
        <Select
          fullWidth
          size="small"
          label="Select"
          name="formId"
          onChange={handleChange}
          value={parsedData.formId || ""}
        >
          {standaloneForms?.map((form: FormInterface) => (
            <MenuItem value={form.id}>{form.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );
};
