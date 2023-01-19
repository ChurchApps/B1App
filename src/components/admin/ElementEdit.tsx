import { useState, useEffect } from "react";
import { ErrorMessages, InputBox } from "../index";
import { ApiHelper, ArrayHelper, BlockInterface, ElementInterface } from "@/helpers";
import { Box, Button, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, TextField } from "@mui/material";
import { MarkdownEditor } from "@/appBase/components";
import React from "react";
import { GalleryModal } from "@/appBase/components/gallery/GalleryModal";
import { RowEdit } from "./RowEdit";

type Props = {
  element: ElementInterface;
  updatedCallback: (element: ElementInterface) => void;
  onRealtimeChange: (element: ElementInterface) => void;
};

export function ElementEdit(props: Props) {
  const [blocks, setBlocks] = useState<BlockInterface[]>(null);
  const [selectPhotoField, setSelectPhotoField] = React.useState<string>(null);
  const [element, setElement] = useState<ElementInterface>(null);
  const [errors, setErrors] = useState([]);
  const [innerErrors, setInnerErrors] = useState([]);
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

  const loadBlocks = async () => {
    if (props.element.elementType === "block") {
      let result: BlockInterface[] = await ApiHelper.get("/blocks", "ContentApi");
      setBlocks(ArrayHelper.getAll(result, "blockType", "elementBlock"));
    }
  }

  const handleMarkdownChange = (field: string, newValue: string) => {
    parsedData[field] = newValue;
    let p = { ...element };
    p.answers = parsedData;
    p.answersJSON = JSON.stringify(parsedData);
    if (p.answersJSON !== element.answersJSON) setElement(p);
  };

  const handleSave = () => {
    if (innerErrors.length === 0) {
      ApiHelper.post("/elements", [element], "ContentApi").then((data) => {
        setElement(data);
        props.updatedCallback(data);
      });
    } else {
      setErrors(innerErrors);
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you wish to permanently delete this element?")) {
      ApiHelper.delete("/elements/" + element.id.toString(), "ContentApi").then(() => props.updatedCallback(null));
    }
  };

  const getJsonFields = () => (<TextField fullWidth label="Answers JSON" name="answersJSON" value={element.answersJSON} onChange={handleChange} onKeyDown={handleKeyDown} multiline />);
  const getTextFields = () => (
    <Box sx={{ marginTop: 2 }}>
      <MarkdownEditor value={parsedData.text || ""} onChange={val => handleMarkdownChange("text", val)} style={{ maxHeight: 200, overflowY: "scroll" }} />
    </Box>
  );
  const getTextWithPhotoFields = () => (<>
    {parsedData.photo && <><img src={parsedData.photo} style={{ maxHeight: 100, maxWidth: "100%", width: "auto" }} /><br /></>}
    <Button variant="contained" onClick={() => setSelectPhotoField("photo")}>Select photo</Button>
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
    <Box sx={{ marginTop: 2 }}>
      <MarkdownEditor value={parsedData.text || ""} onChange={val => handleMarkdownChange("text", val)} style={{ maxHeight: 200, overflowY: "scroll" }} />
    </Box>
  </>);

  const getCardFields = () => (<>
    {parsedData.photo && <><img src={parsedData.photo} style={{ maxHeight: 100, maxWidth: "100%", width: "auto" }} /><br /></>}
    <Button variant="contained" onClick={() => setSelectPhotoField("photo")}>Select photo</Button>
    <TextField fullWidth label="Photo Label" name="photoAlt" value={parsedData.photoAlt || ""} onChange={handleChange} onKeyDown={handleKeyDown} />
    <TextField fullWidth label="Link Url" name="url" value={parsedData.url || ""} onChange={handleChange} onKeyDown={handleKeyDown} />
    <TextField fullWidth label="Title" name="title" value={parsedData.title || ""} onChange={handleChange} onKeyDown={handleKeyDown} />
    <Box sx={{ marginTop: 2 }}>
      <MarkdownEditor value={parsedData.text || ""} onChange={val => handleMarkdownChange("text", val)} style={{ maxHeight: 200, overflowY: "scroll" }} />
    </Box>
  </>);

  const getLogoFields = () => (<>
    <TextField fullWidth label="Link Url (optional)" name="url" value={parsedData.url || ""} onChange={handleChange} onKeyDown={handleKeyDown} />
  </>);

  const getFields = () => {
    let result = getJsonFields();
    switch (element?.elementType) {
      case "row": result = <RowEdit parsedData={parsedData} onRealtimeChange={handleRowChange} setErrors={setInnerErrors} />; break;
      case "text": result = getTextFields(); break;
      case "textWithPhoto": result = getTextWithPhotoFields(); break;
      case "card": result = getCardFields(); break;
      case "logo": result = getLogoFields(); break;
      case "donation": result = <></>; break;
    }
    return result;
  }

  const handlePhotoSelected = (image: string) => {
    let p = { ...element };
    parsedData[selectPhotoField] = image;
    p.answersJSON = JSON.stringify(parsedData);
    setElement(p);
    setSelectPhotoField(null);
  }

  const handleRowChange = (parsedData: any) => {
    let e = { ...element };
    e.answersJSON = JSON.stringify(parsedData);
    setElement(e);
  }

  useEffect(() => { setElement(props.element); loadBlocks() }, [props.element]);
  /*
  useEffect(() => {
    if (element && JSON.stringify(element) !== JSON.stringify(props.element)) props.onRealtimeChange(element);

  }, [element]);
  */

  const getStandardFields = () => {
    return (<>
      <ErrorMessages errors={errors} />
      <br />
      <FormControl fullWidth>
        <InputLabel>Element Type</InputLabel>
        <Select fullWidth label="Element Type" value={element.elementType} name="elementType" onChange={handleChange}>
          <MenuItem value="row">Row</MenuItem>
          <MenuItem value="text">Text</MenuItem>
          <MenuItem value="textWithPhoto">Text with Photo</MenuItem>
          <MenuItem value="card">Card</MenuItem>
          <MenuItem value="logo">Logo</MenuItem>
          <MenuItem value="donation">Donation</MenuItem>
        </Select>
      </FormControl>
      {getFields()}
    </>)
  }

  const getBlockFields = () => {
    let options: JSX.Element[] = [];
    blocks?.forEach(b => {
      options.push(<MenuItem value={b.id}>{b.name}</MenuItem>)
    });
    return (<>
      <FormControl fullWidth>
        <InputLabel>Block</InputLabel>
        <Select fullWidth label="Block" name="targetBlockId" value={parsedData.targetBlockId || ""} onChange={handleChange}>
          {options}
        </Select>
      </FormControl>
    </>)
  }

  if (!element) return <></>
  else return (
    <>
      <InputBox id="elementDetailsBox" headerText="Edit Element" headerIcon="school" saveFunction={handleSave} cancelFunction={handleCancel} deleteFunction={handleDelete} >
        {(element?.elementType === "block") ? getBlockFields() : getStandardFields()}
      </InputBox>
      {selectPhotoField && <GalleryModal onClose={() => setSelectPhotoField(null)} onSelect={handlePhotoSelected} aspectRatio={0} />}
    </>
  );
}