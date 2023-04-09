import { TextField, Box, SelectChangeEvent } from "@mui/material";
import { MarkdownEditor } from "..";

type Props = {
  parsedData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => void;
  handleMarkdownChange: (field: string, newValue: string) => void;
};

export const FaqEdit = ({ parsedData, handleChange, handleMarkdownChange }: Props) => (
  <>
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
