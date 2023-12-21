import { useState, useEffect } from "react";
import { BlockInterface, ElementInterface, GlobalStyleInterface } from "@/helpers";
import { Box, Button, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, TextField, Checkbox, FormGroup, FormControlLabel, Typography, Slider } from "@mui/material";
import { MarkdownEditor, ErrorMessages, InputBox, ApiHelper, ArrayHelper } from "@churchapps/apphelper";
import React from "react";
import { GalleryModal } from "@churchapps/apphelper";
import { RowEdit } from "./RowEdit";
import { FormEdit } from "./FormEdit";
import { FaqEdit } from "./FaqEdit";
import { CalendarElementEdit } from "./CalendarElementEdit";
import { PickColors } from "./PickColors";

type Props = {
  element: ElementInterface;
  globalStyles: GlobalStyleInterface;
  updatedCallback: (element: ElementInterface) => void;
  onRealtimeChange: (element: ElementInterface) => void;
};

export function ElementEdit(props: Props) {
  const [blocks, setBlocks] = useState<BlockInterface[]>(null);
  const [selectPhotoField, setSelectPhotoField] = React.useState<string>(null);
  const [element, setElement] = useState<ElementInterface>(null);
  const [errors, setErrors] = useState([]);
  const [innerErrors, setInnerErrors] = useState([]);
  let parsedData = (element?.answersJSON) ? JSON.parse(element.answersJSON) : {}

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

  const getTextAlignment = (fieldName:string, label:string="Text Alignment") => (
    <FormControl fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select fullWidth size="small" label="Text Alignment" name={fieldName} value={parsedData[fieldName] || "left"} onChange={handleChange}>
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

  const getJsonFields = () => (<TextField fullWidth size="small" label="Answers JSON" name="answersJSON" value={element.answersJSON} onChange={handleChange} onKeyDown={handleKeyDown} multiline />);

  const selectColors = (background:string, textColor:string) => {
    let p = { ...element };
    parsedData["background"] = background;
    parsedData["textColor"] = textColor;
    p.answersJSON = JSON.stringify(parsedData);
    setElement(p);
  }

  const getBoxFields = () => (
    <>
      <FormControlLabel control={<Checkbox onChange={handleCheck} checked={parsedData.rounded === "true" ? true : false} />} name="rounded" label="Rounded Corners" />
      <FormControlLabel control={<Checkbox onChange={handleCheck} checked={parsedData.translucent === "true" ? true : false} />} name="translucent" label="Translucent" />
      <br />
      <PickColors background={parsedData?.background} textColor={parsedData?.textColor} updatedCallback={selectColors} globalStyles={props.globalStyles} />
    </>
  );

  const getTextFields = () => (
    <>
      {getTextAlignment("textAlignment")}
      <Box sx={{ marginTop: 2 }}>
        <MarkdownEditor value={parsedData.text || ""} onChange={val => handleMarkdownChange("text", val)} style={{ maxHeight: 200, overflowY: "scroll" }} textAlign={parsedData.textAlignment} />
      </Box>
    </>
  );

  // TODO: add alt field while saving image and use it here, in image tage.
  const getTextWithPhotoFields = () => (<>
    {parsedData.photo && <><img src={parsedData.photo} style={{ maxHeight: 100, maxWidth: "100%", width: "auto" }} alt="Image describing the topic" /><br /></>}
    <Button variant="contained" onClick={() => setSelectPhotoField("photo")}>Select photo</Button>
    <TextField fullWidth size="small" label="Photo Label" name="photoAlt" value={parsedData.photoAlt || ""} onChange={handleChange} onKeyDown={handleKeyDown} />
    <FormControl fullWidth>
      <InputLabel>Photo Position</InputLabel>
      <Select fullWidth size="small" label="Photo Position" name="photoPosition" value={parsedData.photoPosition || ""} onChange={handleChange}>
        <MenuItem value="left">Left</MenuItem>
        <MenuItem value="right">Right</MenuItem>
        <MenuItem value="top">Top</MenuItem>
        <MenuItem value="bottom">Bottom</MenuItem>
      </Select>
    </FormControl>
    {getTextAlignment("textAlignment")}
    <Box sx={{ marginTop: 2 }}>
      <MarkdownEditor value={parsedData.text || ""} onChange={val => handleMarkdownChange("text", val)} style={{ maxHeight: 200, overflowY: "scroll" }} textAlign={parsedData.textAlignment} />
    </Box>
  </>);

  // TODO: add alt field while saving image and use it here, in image tage.
  const getCardFields = () => (<>
    {parsedData.photo && <><img src={parsedData.photo} style={{ maxHeight: 100, maxWidth: "100%", width: "auto" }} alt="Image describing the topic" /><br /></>}
    <Button variant="contained" onClick={() => setSelectPhotoField("photo")}>Select photo</Button>
    <TextField fullWidth size="small" label="Photo Label" name="photoAlt" value={parsedData.photoAlt || ""} onChange={handleChange} onKeyDown={handleKeyDown} />
    <TextField fullWidth size="small" label="Link Url (optional)" name="url" value={parsedData.url || ""} onChange={handleChange} onKeyDown={handleKeyDown} />
    {getTextAlignment("titleAlignment", "Title Alignment")}
    <TextField fullWidth size="small" label="Title" name="title" value={parsedData.title || ""} onChange={handleChange} onKeyDown={handleKeyDown} />
    {getTextAlignment("textAlignment")}
    <Box sx={{ marginTop: 2 }}>
      <MarkdownEditor value={parsedData.text || ""} onChange={val => handleMarkdownChange("text", val)} style={{ maxHeight: 200, overflowY: "scroll", zindex: -1 }} textAlign={parsedData.textAlignment} />
    </Box>
  </>);

  const getLogoFields = () => (<>
    <TextField fullWidth size="small" label="Link Url (optional)" name="url" value={parsedData.url || ""} onChange={handleChange} onKeyDown={handleKeyDown} />
  </>);

  const getStreamFields = () => {
    let blockField = <></>
    if (parsedData.offlineContent==="block")  {
      let options: JSX.Element[] = [];
      blocks?.forEach(b => { options.push(<MenuItem value={b.id}>{b.name}</MenuItem>) });
      blockField = (<FormControl fullWidth>
        <InputLabel>Block</InputLabel>
        <Select fullWidth size="small" label="Block" name="targetBlockId" value={parsedData.targetBlockId || ""} onChange={handleChange}>
          {options}
        </Select>
      </FormControl>);
    }
    return (
      <>
        <FormControl fullWidth>
          <InputLabel>Mode</InputLabel>
          <Select fullWidth size="small" label="Mode" name="mode" value={parsedData.mode || "video"} onChange={handleChange}>
            <MenuItem value="video">Video Only</MenuItem>
            <MenuItem value="interaction">Video and Interaction</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel>Offline Content</InputLabel>
          <Select fullWidth size="small" label="Offline Content" name="offlineContent" value={parsedData.offlineContent || "countdown"} onChange={handleChange}>
            <MenuItem value="countdown">Next Service Time</MenuItem>
            <MenuItem value="hide">Hide</MenuItem>
            <MenuItem value="block">Block</MenuItem>
          </Select>
        </FormControl>
        {blockField}
      </>
    )
  }

  const getIframeFields = () => (
    <>
      <TextField fullWidth size="small" label="Source" name="iframeSrc" value={parsedData.iframeSrc || ""} onChange={handleChange} />
      <TextField fullWidth size="small" label="Height (px)" name="iframeHeight" value={parsedData.iframeHeight || ""} placeholder="1000" onChange={handleChange} />
    </>
  )

  const getButtonLink = () => (
    <>
      <TextField fullWidth size="small" label="Text" name="buttonLinkText" value={parsedData.buttonLinkText || ""} onChange={handleChange} />
      <TextField fullWidth size="small" label="url" name="buttonLinkUrl" value={parsedData.buttonLinkUrl || ""} onChange={handleChange} />
      <FormControl fullWidth>
        <InputLabel>Variant</InputLabel>
        <Select fullWidth size="small" label="Button Type" name="buttonLinkVariant" value={parsedData.buttonLinkVariant || "contained"} onChange={handleChange}>
          <MenuItem value="contained">Contained</MenuItem>
          <MenuItem value="outlined">Outlined</MenuItem>
        </Select>
      </FormControl>
      <FormControl fullWidth>
        <InputLabel>Color</InputLabel>
        <Select fullWidth size="small" label="Button Type" name="buttonLinkColor" value={parsedData.buttonLinkColor || "primary"} onChange={handleChange}>
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

  const getVideoFields = () => (
    <>
      <FormControl fullWidth>
        <InputLabel>Type</InputLabel>
        <Select fullWidth size="small" label="Type" name="videoType" onChange={handleChange} value={parsedData.videoType || "youtube"}>
          <MenuItem value="youtube">Youtube</MenuItem>
          <MenuItem value="vimeo">Vimeo</MenuItem>
        </Select>
      </FormControl>
      <TextField fullWidth size="small" label="Id" name="videoId" value={parsedData.videoId || ""} onChange={handleChange} />
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

  const getRawHTML = () => (
    <>
      <TextField fullWidth label="HTML Content" name="rawHTML" onChange={handleChange} value={parsedData.rawHTML || ""} multiline minRows={7} maxRows={15} />
    </>
  )

  const getMapFields = () => (
    <>
      <TextField fullWidth size="small" label="Address" name="mapAddress" onChange={handleChange} value={parsedData.mapAddress || ""} helperText="ex: City Hall, New York, NY" />
      <TextField fullWidth size="small" label="Label" name="mapLabel" onChange={handleChange} value={parsedData.mapLabel || ""} helperText="ex: First Baptist Church" />
      <Typography fontSize="13px" sx={{marginTop: 1}}>Zoom-level</Typography>
      <Slider defaultValue={15} valueLabelDisplay="auto" step={1} min={8} max={20} name="mapZoom" value={parsedData.mapZoom || 15} onChange={(e: any) => handleChange(e)} />
      <Typography fontSize="12px" fontStyle="italic">Ex: 0(the whole world) & 21(individual buildings)</Typography>
    </>
  )

  const getCarouselFields = () => (
    <>
      <TextField fullWidth size="small" type="number" label="Height(Px)" name="height" onChange={handleChange} value={parsedData.height || "250"} />
      <TextField fullWidth size="small" type="number" label="Slides" name="slides" onChange={handleChange} value={parsedData.slides || ""} />
      <FormControl fullWidth>
        <InputLabel>Animation Options</InputLabel>
        <Select fullWidth size="small" label="Animation Options" name="animationOptions" onChange={handleChange} value={parsedData.animationOptions || "fade"}>
          <MenuItem value="fade">Fade</MenuItem>
          <MenuItem value="slide">Slide</MenuItem>
        </Select>
      </FormControl>
      <FormGroup>
        <FormControlLabel control={<Checkbox size="small" onChange={handleCheck} checked={parsedData.autoplay === "true" ? true : false} />} name="autoplay" label="Autoplay" />
      </FormGroup>
      {parsedData.autoplay === "true" && (
        <TextField fullWidth size="small" type="number" label="Slides Interval (seconds)" name="interval" onChange={handleChange} value={parsedData.interval || "4"} />
      )}
    </>
  )

  const getImageFields = () => (
    <>
      {parsedData.photo && <><img src={parsedData.photo} style={{ maxHeight: 100, maxWidth: "100%", width: "auto" }} alt="Image describing the topic" /><br /></>}
      <Button variant="contained" onClick={() => setSelectPhotoField("photo")}>Select photo</Button>
      <TextField fullWidth size="small" label="Photo Label" name="photoAlt"  value={parsedData.photoAlt || ""} onChange={handleChange} onKeyDown={handleKeyDown} />
      <TextField fullWidth size="small" label="Link Url (optional)" name="url" value={parsedData.url || ""} onChange={handleChange} onKeyDown={handleKeyDown} />
      <FormGroup sx={{ marginLeft: 0.5}}>
        <FormControlLabel control={<Checkbox size="small" onChange={handleCheck} checked={parsedData.external === "true" ? true : false} />} name="external" label="Open in new Tab" />
      </FormGroup>
    </>
  )

  const getWhiteSpaceFields = () => (
    <>
      <TextField fullWidth size="small" type="number" label="Height(Px)" name="height" onChange={handleChange} value={parsedData.height || "25"} />
    </>
  )

  const getFields = () => {
    let result = getJsonFields();
    switch (element?.elementType) {
      case "row": result = <RowEdit parsedData={parsedData} onRealtimeChange={handleRowChange} setErrors={setInnerErrors} />; break;
      case "box": result = getBoxFields(); break;
      case "text": result = getTextFields(); break;
      case "textWithPhoto": result = getTextWithPhotoFields(); break;
      case "card": result = getCardFields(); break;
      case "logo": result = getLogoFields(); break;
      case "donation": result = <></>; break;
      case "stream": result = getStreamFields(); break;
      case "iframe": result = getIframeFields(); break;
      case "buttonLink": result = getButtonLink(); break;
      case "video": result = getVideoFields(); break;
      case "rawHTML": result = getRawHTML(); break;
      case "form": result = <FormEdit parsedData={parsedData} handleChange={handleChange} />; break;
      case "faq": result = <FaqEdit parsedData={parsedData} handleChange={handleChange} handleMarkdownChange={handleMarkdownChange} />; break;
      case "map": result = getMapFields(); break;
      case "sermons": result = <></>; break;
      case "carousel": result = getCarouselFields(); break;
      case "image": result = getImageFields(); break;
      case "whiteSpace": result = getWhiteSpaceFields(); break;
      case "calendar": result = <CalendarElementEdit parsedData={parsedData} handleChange={handleChange} />; break;
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
      if (blocks===null)
      {
        if (props.element.elementType === "block" || (props.element.elementType==="stream" && parsedData?.offlineContent==="block")) {
          let result: BlockInterface[] = await ApiHelper.get("/blocks", "ContentApi");
          setBlocks(ArrayHelper.getAll(result, "blockType", "elementBlock"));
        }
      }
    }

    loadBlocks();
  }, [element]);


  const getStandardFields = () => (<>
    <ErrorMessages errors={errors} />
    {getFields()}
  </>)

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
      <InputBox id="elementDetailsBox" headerText="Edit Element" headerIcon="school" saveFunction={handleSave} cancelFunction={handleCancel} deleteFunction={handleDelete}>
        {(element?.elementType === "block") ? getBlockFields() : getStandardFields()}
      </InputBox>
      {selectPhotoField && <GalleryModal onClose={() => setSelectPhotoField(null)} onSelect={handlePhotoSelected} aspectRatio={0} />}
    </>
  );
}
