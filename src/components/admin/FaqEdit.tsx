import { useState } from "react";
import {
  TextField,
  Box,
  SelectChangeEvent,
  Stack,
  Button,
  InputLabel,
} from "@mui/material";
import { MarkdownEditor } from "..";

type Props = {
  parsedData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => void;
  handleMarkdownChange: (field: string, newValue: string) => void;
};

export const FaqEdit = ({
  parsedData,
  handleChange,
  handleMarkdownChange,
}: Props) => {
  const [elements, setElements] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const addElement = () => {
    console.log("add got clicked!");
    const obj = { title: parsedData.faqTitle, description: parsedData.text };
    const newArray = [...elements];
    newArray.push(obj);
    setElements(newArray);
  };
  // elements.forEach((e) => {
  //   console.log("eeeeeeeeeeeeeeeee: ", e);

  //   parsedData[`accordion_${e.title}`] = e.description;
  // });
  // console.log("elements: ", elements);

  // console.log("parsed data: ", parsedData);

  return (
    <>
      <div>{JSON.stringify(elements)}</div>
      <TextField
        fullWidth
        label="Title"
        name="faqTitle"
        value={parsedData.faqTitle || ""}
        onChange={handleChange}
      />
      <Box sx={{ marginTop: 2 }}>
        <MarkdownEditor
          value={parsedData.text || ""}
          onChange={(val) => handleMarkdownChange("text", val)}
          style={{ maxHeight: 200, overflowY: "scroll" }}
        />
      </Box>
      <Stack direction="row" spacing={3}>
        <Button fullWidth variant="contained">
          Remove
        </Button>
        <Button fullWidth variant="contained" onClick={addElement}>
          Add
        </Button>
      </Stack>
    </>
  );
};
