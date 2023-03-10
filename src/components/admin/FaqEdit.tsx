import { useState } from "react";
import {
  TextField,
  Box,
  SelectChangeEvent,
  Stack,
  Button,
  InputLabel,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  Typography,
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
  const [faqTitle, setFaqTitle] = useState("");
  const [faqDescription, setFaqDescription] = useState("");

  const changeHandler = () => {}

  const addElement = () => {
    console.log("add got clicked!");
    const obj = { title: parsedData.faqTitle, description: parsedData.text };
    const newArray = [...elements];
    newArray.push(obj);
    setElements(newArray);
  };

  // if (elements.length !== 0) {
  //   parsedData["lists"] = elements;
  // }
  // elements.forEach((e) => {
  //   console.log("eeeeeeeeeeeeeeeee: ", e);

  //   parsedData[`accordion_${e.title}`] = e.description;
  // });
  // console.log("elements: ", elements);

  // console.log("parsed data: ", parsedData);

  const getRows = () => {
    return (
      <Table size="small">
        <TableHead>
          <TableRow sx={{ textAlign: "left" }}>
            <th>Value</th>
            <th>Action</th>
          </TableRow>
        </TableHead>
        <TableBody>
          {parsedData?.list?.map((element) => (
            <TableRow>
              <TableCell>
                <Typography>{element.title}</Typography>
              </TableCell>
              <TableCell>
                <Button>Remove</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <>
    <TextField fullWidth label="Title" name="faqTitle" value={faqTitle} onChange={changeHandler} />
    <Box sx={{ marginTop: 2 }}>
      <MarkdownEditor
      value={faqDescription}
      onChange={changeHandler}
      style={{ maxHeight: 200, overflowY: "scroll" }}
      />
    </Box>
    {/* {getRows()}
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
        <Button sx={{marginTop: 2}} fullWidth variant="contained" onClick={addElement}>
          Add
        </Button> */}
    </>
  );
};
