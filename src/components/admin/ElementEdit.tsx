import { useState, useEffect } from "react";
import { ErrorMessages, InputBox } from "../index";
import { ApiHelper, ArrayHelper, BlockInterface, ElementInterface } from "@/helpers";
import { Box, Button, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, TextField, Checkbox, FormGroup, FormControlLabel, Typography } from "@mui/material";
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

  const handleCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    let p = { ...element };
    let val: any = e.target.checked.toString();
    switch (e.target.name) {
      case "elementType": p.elementType = val; break;
      case "answersJSON": p.answersJSON = val; break;
      default:
        parsedData[e.target.name] = val;
        p.answersJSON = JSON.stringify(parsedData);
        break;
    }
    setElement(p);
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

  const selectTextAlignment = (
    <FormControl fullWidth>
      <InputLabel>Text Alignment</InputLabel>
      <Select fullWidth label="Text Alignment" name="textAlignment" value={parsedData.textAlignment || "left"} onChange={handleChange}>
        <MenuItem value="left">Left</MenuItem>
        <MenuItem value="center">Center</MenuItem>
        <MenuItem value="right">Right</MenuItem>
      </Select>
    </FormControl>
  )

  const handleDelete = () => {
    if (window.confirm("Are you sure you wish to permanently delete this element?")) {
      ApiHelper.delete("/elements/" + element.id.toString(), "ContentApi").then(() => props.updatedCallback(null));
    }
  };

  const getJsonFields = () => (<TextField fullWidth label="Answers JSON" name="answersJSON" value={element.answersJSON} onChange={handleChange} onKeyDown={handleKeyDown} multiline />);
  const getTextFields = () => (
    <>
      {selectTextAlignment}
      <Box sx={{ marginTop: 2 }}>
        <MarkdownEditor value={parsedData.text || ""} onChange={val => handleMarkdownChange("text", val)} style={{ maxHeight: 200, overflowY: "scroll" }} textAlign={parsedData.textAlignment} />
      </Box>
    </>
  );

  // TODO: add alt field while saving image and use it here, in image tage.
  const getTextWithPhotoFields = () => (<>
    {parsedData.photo && <><img src={parsedData.photo} style={{ maxHeight: 100, maxWidth: "100%", width: "auto" }} alt="Image describing the topic" /><br /></>}
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
    {selectTextAlignment}
    <Box sx={{ marginTop: 2 }}>
      <MarkdownEditor value={parsedData.text || ""} onChange={val => handleMarkdownChange("text", val)} style={{ maxHeight: 200, overflowY: "scroll" }} textAlign={parsedData.textAlignment} />
    </Box>
  </>);

  // TODO: add alt field while saving image and use it here, in image tage.
  const getCardFields = () => (<>
    {parsedData.photo && <><img src={parsedData.photo} style={{ maxHeight: 100, maxWidth: "100%", width: "auto" }} alt="Image describing the topic" /><br /></>}
    <Button variant="contained" onClick={() => setSelectPhotoField("photo")}>Select photo</Button>
    <TextField fullWidth label="Photo Label" name="photoAlt" value={parsedData.photoAlt || ""} onChange={handleChange} onKeyDown={handleKeyDown} />
    <TextField fullWidth label="Link Url" name="url" value={parsedData.url || ""} onChange={handleChange} onKeyDown={handleKeyDown} />
    <TextField fullWidth label="Title" name="title" value={parsedData.title || ""} onChange={handleChange} onKeyDown={handleKeyDown} />
    {selectTextAlignment}
    <Box sx={{ marginTop: 2 }}>
      <MarkdownEditor value={parsedData.text || ""} onChange={val => handleMarkdownChange("text", val)} style={{ maxHeight: 200, overflowY: "scroll" }} textAlign={parsedData.textAlignment} />
    </Box>
  </>);

  const getLogoFields = () => (<>
    <TextField fullWidth label="Link Url (optional)" name="url" value={parsedData.url || ""} onChange={handleChange} onKeyDown={handleKeyDown} />
  </>);

  const getStreamFields = () => {
    let blockField = <></>
    if (parsedData.offlineContent==="block")  {
      let options: JSX.Element[] = [];
      blocks?.forEach(b => { options.push(<MenuItem value={b.id}>{b.name}</MenuItem>) });
      blockField = (<FormControl fullWidth>
          <InputLabel>Block</InputLabel>
          <Select fullWidth label="Block" name="targetBlockId" value={parsedData.targetBlockId || ""} onChange={handleChange}>
            {options}
          </Select>
        </FormControl>);
    }
    return (
      <>
        <FormControl fullWidth>
          <InputLabel>Mode</InputLabel>
          <Select fullWidth label="Mode" name="mode" value={parsedData.mode || "video"} onChange={handleChange}>
            <MenuItem value="video">Video Only</MenuItem>
            <MenuItem value="interaction">Video and Interaction</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel>Offline Content</InputLabel>
          <Select fullWidth label="Offline Content" name="offlineContent" value={parsedData.offlineContent || "countdown"} onChange={handleChange}>
            <MenuItem value="countdown">Next Service Time</MenuItem>
            <MenuItem value="hide">Hide</MenuItem>
            <MenuItem value="block">Block</MenuItem>
          </Select>
        </FormControl>
        {blockField}
      </>
    )
  }

  const getIframeFields = () => {
    return (
      <>
        <TextField fullWidth label="Source" name="iframeSrc" value={parsedData.iframeSrc || ""} onChange={handleChange} />
        <TextField fullWidth label="Height (px)" name="iframeHeight" value={parsedData.iframeHeight || ""} placeholder="1000" onChange={handleChange} />
      </>
    )
  }

  const getButtonLink = () => {
    return (
      <>
        <TextField fullWidth label="Text" name="buttonLinkText" value={parsedData.buttonLinkText || ""} onChange={handleChange} />
        <TextField fullWidth label="url" name="buttonLinkUrl" value={parsedData.buttonLinkUrl || ""} onChange={handleChange} />
        <FormControl fullWidth>
          <InputLabel>Variant</InputLabel>
          <Select fullWidth label="Button Type" name="buttonLinkVariant" value={parsedData.buttonLinkVariant || "contained"} onChange={handleChange}>
            <MenuItem value="contained">Contained</MenuItem>
            <MenuItem value="outlined">Outlined</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel>Color</InputLabel>
          <Select fullWidth label="Button Type" name="buttonLinkColor" value={parsedData.buttonLinkColor || "primary"} onChange={handleChange}>
            <MenuItem value="primary">Primary</MenuItem>
            <MenuItem value="secondary">Secondary</MenuItem>
            <MenuItem value="error">Error</MenuItem>
            <MenuItem value="warning">Warning</MenuItem>
            <MenuItem value="info">Info</MenuItem>
            <MenuItem value="success">Success</MenuItem>
          </Select>
        </FormControl>
        <FormGroup sx={{ marginLeft: 1, marginY: 2 }}>
          <FormControlLabel control={<Checkbox onChange={handleCheck} checked={parsedData.external === "true" ? true : false} />} name="external" label="Open in new Tab" />
          <FormControlLabel control={<Checkbox onChange={handleCheck} checked={parsedData.fullWidth === "true" ? true : false} />} name="fullWidth" label="Full width" />
        </FormGroup>
      </>
    )
  }

  const getVideoFields = () => {
    return (
      <>
        <FormControl fullWidth>
          <InputLabel>Type</InputLabel>
          <Select fullWidth label="Type" name="videoType" onChange={handleChange} value={parsedData.videoType || "youtube"}>
            <MenuItem value="youtube">Youtube</MenuItem>
            <MenuItem value="vimeo">Vimeo</MenuItem>
          </Select>
        </FormControl>
        <TextField fullWidth label="Id" name="videoId" value={parsedData.videoId || ""} onChange={handleChange}/>
        <TextField fullWidth label="Height (px)" name="videoHeight" value={parsedData.videoHeight || "300px"} onChange={handleChange}/>
        {(!parsedData.videoType || parsedData.videoType === "youtube") && (
          <Typography fontSize="12px" fontStyle="italic">
            video url - https://www.youtube.com/watch?v=dQw4w9WgXcQ <br /> id - dQw4w9WgXcQ
          </Typography>
        )}
        {parsedData.videoType === "vimeo" && (
          <Typography fontSize="12px" fontStyle="italic">
            video url - https://vimeo.com/751393851 <br /> id - 751393851
          </Typography>
        )}
      </>
    )
  }

  const getFields = () => {
    let result = getJsonFields();
    switch (element?.elementType) {
      case "row": result = <RowEdit parsedData={parsedData} onRealtimeChange={handleRowChange} setErrors={setInnerErrors} />; break;
      case "text": result = getTextFields(); break;
      case "textWithPhoto": result = getTextWithPhotoFields(); break;
      case "card": result = getCardFields(); break;
      case "logo": result = getLogoFields(); break;
      case "donation": result = <></>; break;
      case "stream": result = getStreamFields(); break;
      case "iframe": result = getIframeFields(); break;
      case "buttonLink": result = getButtonLink(); break;
      case "video": result = getVideoFields(); break;
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

  useEffect(() => { setElement(props.element); }, [props.element]);

  useEffect(() => {
    const loadBlocks = async () => {
      console.log(props.element, parsedData);
      if (blocks===null)
      {
        if (props.element.elementType === "block" || (props.element.elementType==="stream" && parsedData?.offlineContent==="block")) {
          console.log("MADE IT");
          let result: BlockInterface[] = await ApiHelper.get("/blocks", "ContentApi");
          setBlocks(ArrayHelper.getAll(result, "blockType", "elementBlock"));
        }
      }
    }
 
    loadBlocks();
  }, [element]);

  /*
  useEffect(() => {
    if (element && JSON.stringify(element) !== JSON.stringify(props.element)) props.onRealtimeChange(element);

  }, [element]);
  */

  /*
  <FormControl fullWidth>
        <InputLabel>Element Type</InputLabel>
        <Select fullWidth label="Element Type" value={element.elementType} name="elementType" onChange={handleChange}>
          <MenuItem value="row">Row</MenuItem>
          <MenuItem value="text">Text</MenuItem>
          <MenuItem value="textWithPhoto">Text with Photo</MenuItem>
          <MenuItem value="card">Card</MenuItem>
          <MenuItem value="logo">Logo</MenuItem>
          <MenuItem value="donation">Donation</MenuItem>
          <MenuItem value="stream">Stream</MenuItem>
          <MenuItem value="iframe">Embed Page</MenuItem>
          <MenuItem value="buttonLink">Button</MenuItem>
        </Select>
      </FormControl>
  */

  const getStandardFields = () => {
    return (<>
      <ErrorMessages errors={errors} />
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