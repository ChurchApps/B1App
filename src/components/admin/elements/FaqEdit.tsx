import { TextField, Box, SelectChangeEvent, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { MarkdownEditor } from "@churchapps/apphelper";

type Props = {
  parsedData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => void;
  handleMarkdownChange: (field: string, newValue: string) => void;
};

export const FaqEdit = ({ parsedData, handleChange, handleMarkdownChange }: Props) => (
  <>
    <FormControl fullWidth>
      <InputLabel>Heading Type</InputLabel>
      <Select fullWidth label="Heading Type" name="headingType" value={parsedData.headingType} onChange={handleChange}>
        <MenuItem value="h6">Heading</MenuItem>
        <MenuItem value="link">Link</MenuItem>
      </Select>
    </FormControl>
    <TextField fullWidth label="Title" name="title" size="small" value={parsedData.title || ""} onChange={handleChange} />
    <Box sx={{ marginTop: 2 }}>
      <MarkdownEditor
        value={parsedData.description || ""}
        onChange={(val) => handleMarkdownChange("description", val)}
        style={{ maxHeight: 200, overflowY: "scroll" }}
      />
    </Box>
  </>
);
