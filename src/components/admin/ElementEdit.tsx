import { useState, useEffect } from "react";
import { ErrorMessages, InputBox } from "../index";
import { ApiHelper, ElementInterface, UserHelper } from "@/helpers";
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, TextField } from "@mui/material";
import { MarkdownEditor } from "@/appBase/components";

type Props = {
  element: ElementInterface;
  updatedCallback: (element: ElementInterface) => void;
};

export function ElementEdit(props: Props) {
  const [element, setElement] = useState<ElementInterface>(null);
  const [errors, setErrors] = useState([]);
  var parsedData = (element?.answersJSON) ? JSON.parse(element.answersJSON) : {}

  const handleCancel = () => props.updatedCallback(element);
  const handleKeyDown = (e: React.KeyboardEvent<any>) => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    e.preventDefault();
    let p = { ...element };
    const val = e.target.value;
    switch (e.target.name) {
      case "elementType": p.elementType = val; break;
      case "answersJSON": p.answersJSON = val; break;
      default:
        parsedData[e.target.name] = val;
        p.answersJSON = JSON.stringify(parsedData);
        break;
    }
    setElement(p);
  };

  const handleMarkdownChange = (field: string, newValue: string) => {
    let p = { ...element };
    parsedData[field] = newValue;
    p.answersJSON = JSON.stringify(parsedData);
    setElement(p);
  };

  const validate = () => {
    let errors = [];
    setErrors(errors);
    return errors.length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      ApiHelper.post("/elements", [element], "ContentApi").then((data) => {
        setElement(data);
        props.updatedCallback(data);
      });
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you wish to permanently delete this element?")) {
      ApiHelper.delete("/elements/" + element.id.toString(), "ContentApi").then(() => props.updatedCallback(null));
    }
  };

  const getJsonFields = () => (<TextField fullWidth label="Answers JSON" name="answersJSON" value={element.answersJSON} onChange={handleChange} onKeyDown={handleKeyDown} multiline />);
  const getColumnFields = () => (<TextField fullWidth label="Column width (12 per row; 6 columns = 1/2, 4 columns = 1/3)" name="size" type="number" value={parsedData.size || ""} onChange={handleChange} onKeyDown={handleKeyDown} />);
  const getTextFields = () => (<MarkdownEditor value={parsedData.text || ""} onChange={(val) => { handleMarkdownChange("text", val) }} />);
  const getTextWithPhotoFields = () => (<>
    <TextField fullWidth label="Photo" name="photo" value={parsedData.photo || ""} onChange={handleChange} onKeyDown={handleKeyDown} />
    <TextField fullWidth label="Photo Label" name="photoAlt" value={parsedData.photoAlt || ""} onChange={handleChange} onKeyDown={handleKeyDown} />
    <FormControl fullWidth>
      <InputLabel>Photo Position</InputLabel>
      <Select fullWidth label="Photo Position" name="photoPosition" value={parsedData.photoPosition || ""} onChange={handleChange}>
        <MenuItem value="left">Left</MenuItem>
        <MenuItem value="right">Right</MenuItem>
        <MenuItem value="top">Top</MenuItem>
        <MenuItem value="bottom">Bottom</MenuItem>
      </Select>
    </FormControl>
    <MarkdownEditor value={parsedData.text || ""} onChange={(val) => { handleMarkdownChange("text", val) }} />
  </>);

  const getFields = () => {
    let result = getJsonFields();
    switch (element?.elementType) {
      case "row": result = <></>; break;
      case "column": result = getColumnFields(); break;
      case "text": result = getTextFields(); break;
      case "textWithPhoto": result = getTextWithPhotoFields(); break;

    }
    return result;
  }


  useEffect(() => { setElement(props.element); }, [props.element]);

  if (!element) return <></>
  else return (
    <>
      <InputBox id="elementDetailsBox" headerText="Edit Element" headerIcon="school" saveFunction={handleSave} cancelFunction={handleCancel} deleteFunction={handleDelete} >
        <ErrorMessages errors={errors} />
        <br />
        <FormControl fullWidth>
          <InputLabel>Element Type</InputLabel>
          <Select fullWidth label="Element Type" value={element.elementType} onChange={handleChange}>
            <MenuItem value="text">Text</MenuItem>
            <MenuItem value="textWithPhoto">Text with Photo</MenuItem>
            <MenuItem value="row">Row</MenuItem>
            <MenuItem value="column">Column</MenuItem>
          </Select>
        </FormControl>
        {getFields()}
      </InputBox>
    </>
  );
}