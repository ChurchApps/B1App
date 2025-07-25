"use client";
import { useState, useEffect } from "react";
import { AnimationsInterface, BlockInterface, ElementInterface, GlobalStyleInterface, InlineStylesInterface } from "@/helpers";
import { Box, Button, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, TextField, Checkbox, FormGroup, FormControlLabel, Typography, Slider, Dialog } from "@mui/material";
import { MarkdownEditor } from "@churchapps/apphelper/dist/components/markdownEditor/MarkdownEditor";
import { ErrorMessages } from "@churchapps/apphelper/dist/components/ErrorMessages";
import { InputBox } from "@churchapps/apphelper/dist/components/InputBox";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import { ArrayHelper } from "@churchapps/apphelper/dist/helpers/ArrayHelper";
import React from "react";
import { GalleryModal } from "../../gallery/GalleryModal";
import { RowEdit } from "./RowEdit";
import { FormEdit } from "./FormEdit";
import { FaqEdit } from "./FaqEdit";
import { CalendarElementEdit } from "./CalendarElementEdit";
import { DonateLinkEdit } from "./DonateLinkEdit";
import { PickColors } from "./PickColors";
import { TableEdit } from "./TableEdit";
import { StylesAnimations } from "./StylesAnimations";

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
  let parsedStyles = (element?.stylesJSON) ? JSON.parse(element.stylesJSON) : {}
  let parsedAnimations = (element?.animationsJSON) ? JSON.parse(element.animationsJSON) : {}

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

  const handleStyleChange = (styles: InlineStylesInterface) => {
    let p = { ...element };
    p.styles = styles;
    p.stylesJSON = Object.keys(styles).length>0 ? JSON.stringify(styles) : null;

    setElement(p);
  }

  const handleAnimationChange = (animations: AnimationsInterface) => {
    let p = { ...element };
    p.animations = animations;
    p.animationsJSON = Object.keys(animations).length>0 ? JSON.stringify(animations) : null;

    setElement(p);
  }

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
      <Select fullWidth size="small" label="Text Alignment" name={fieldName} value={parsedData[fieldName] || "left"} onChange={handleChange} data-testid={`text-alignment-${fieldName}-select`} aria-label={`Select ${label.toLowerCase()}`}>
        <MenuItem value="left" data-testid="text-align-left" aria-label="Align left">Left</MenuItem>
        <MenuItem value="center" data-testid="text-align-center" aria-label="Align center">Center</MenuItem>
        <MenuItem value="right" data-testid="text-align-right" aria-label="Align right">Right</MenuItem>
      </Select>
    </FormControl>
  )

  const handleDelete = () => {
    if (window.confirm("Are you sure you wish to permanently delete this element?")) {
      ApiHelper.delete("/elements/" + element.id.toString(), "ContentApi").then(() => props.updatedCallback(null));
    }
  };

  const getJsonFields = () => (<TextField fullWidth size="small" label="Answers JSON" name="answersJSON" value={element.answersJSON} onChange={handleChange} onKeyDown={handleKeyDown} multiline data-testid="answers-json-input" aria-label="Answers JSON data" />);

  const selectColors = (background:string, textColor:string, headingColor:string, linkColor:string) => {
    let p = { ...element };
    parsedData["background"] = background;
    parsedData["textColor"] = textColor;
    parsedData["headingColor"] = headingColor;
    parsedData["linkColor"] = linkColor;
    p.answersJSON = JSON.stringify(parsedData);
    setElement(p);
  }

  const getAppearanceFields = (fields:string[]) => <StylesAnimations fields={fields} styles={parsedStyles} onStylesChange={handleStyleChange} animations={parsedAnimations} onAnimationsChange={handleAnimationChange} />

  const getBoxFields = () => (
    <>
      <FormControlLabel control={<Checkbox onChange={handleCheck} checked={parsedData.rounded === "true" ? true : false} />} name="rounded" label="Rounded Corners" />
      <FormControlLabel control={<Checkbox onChange={handleCheck} checked={parsedData.translucent === "true" ? true : false} />} name="translucent" label="Translucent" />
      <br />
      <PickColors background={parsedData?.background} textColor={parsedData?.textColor} headingColor={parsedData?.headingColor || parsedData?.textColor} linkColor={parsedData?.linkColor} updatedCallback={selectColors} globalStyles={props.globalStyles} />
      {getAppearanceFields(["border", "background", "color", "font", "height", "min", "max", "line", "margin", "padding", "text", "width"])}
    </>
  );

  const getTextFields = () => (
    <>
      {getTextAlignment("textAlignment")}
      <Box sx={{ marginTop: 2 }}>
        <MarkdownEditor value={parsedData.text || ""} onChange={val => handleMarkdownChange("text", val)} style={{ maxHeight: 200, overflowY: "scroll" }} textAlign={parsedData.textAlignment} />
      </Box>
      {getAppearanceFields(["font", "color", "line", "margin", "padding", "text"])}
    </>
  );

  // TODO: add alt field while saving image and use it here, in image tage.
  const getTextWithPhotoFields = () => (<>
    {parsedData.photo && <><img src={parsedData.photo} style={{ maxHeight: 100, maxWidth: "100%", width: "auto" }} alt="Image describing the topic" /><br /></>}
    <Button variant="contained" onClick={() => setSelectPhotoField("photo")} data-testid="select-photo-button" aria-label="Select photo">Select photo</Button>
    <TextField fullWidth size="small" label="Photo Label" name="photoAlt" value={parsedData.photoAlt || ""} onChange={handleChange} onKeyDown={handleKeyDown} data-testid="photo-alt-input" aria-label="Photo alternative text" />
    <FormControl fullWidth>
      <InputLabel>Photo Position</InputLabel>
      <Select fullWidth size="small" label="Photo Position" name="photoPosition" value={parsedData.photoPosition || ""} onChange={handleChange} data-testid="photo-position-select" aria-label="Select photo position">
        <MenuItem value="left" data-testid="photo-position-left" aria-label="Position photo on left">Left</MenuItem>
        <MenuItem value="right" data-testid="photo-position-right" aria-label="Position photo on right">Right</MenuItem>
        <MenuItem value="top" data-testid="photo-position-top" aria-label="Position photo on top">Top</MenuItem>
        <MenuItem value="bottom" data-testid="photo-position-bottom" aria-label="Position photo on bottom">Bottom</MenuItem>
      </Select>
    </FormControl>
    {getTextAlignment("textAlignment")}
    <Box sx={{ marginTop: 2 }}>
      <MarkdownEditor value={parsedData.text || ""} onChange={val => handleMarkdownChange("text", val)} style={{ maxHeight: 200, overflowY: "scroll" }} textAlign={parsedData.textAlignment} />
    </Box>
    {getAppearanceFields(["border", "background", "color", "font", "height", "min", "max", "line", "margin", "padding", "text", "width"])}
  </>);

  // TODO: add alt field while saving image and use it here, in image tage.
  const getCardFields = () => (<>
    {parsedData.photo && <><img src={parsedData.photo} style={{ maxHeight: 100, maxWidth: "100%", width: "auto" }} alt="Image describing the topic" /><br /></>}
    <Button variant="contained" onClick={() => setSelectPhotoField("photo")} data-testid="select-photo-button" aria-label="Select photo">Select photo</Button>
    <TextField fullWidth size="small" label="Photo Label" name="photoAlt" value={parsedData.photoAlt || ""} onChange={handleChange} onKeyDown={handleKeyDown} data-testid="photo-alt-input" aria-label="Photo alternative text" />
    <TextField fullWidth size="small" label="Link Url (optional)" name="url" value={parsedData.url || ""} onChange={handleChange} onKeyDown={handleKeyDown} />
    {getTextAlignment("titleAlignment", "Title Alignment")}
    <TextField fullWidth size="small" label="Title" name="title" value={parsedData.title || ""} onChange={handleChange} onKeyDown={handleKeyDown} />
    {getTextAlignment("textAlignment")}
    <Box sx={{ marginTop: 2 }}>
      <MarkdownEditor value={parsedData.text || ""} onChange={val => handleMarkdownChange("text", val)} style={{ maxHeight: 200, overflowY: "scroll", zindex: -1 }} textAlign={parsedData.textAlignment} />
    </Box>
    {getAppearanceFields(["border", "background", "color", "font", "height", "min", "max", "line", "margin", "padding", "text", "width"])}
  </>);

  const getLogoFields = () => (<>
    <TextField fullWidth size="small" label="Link Url (optional)" name="url" value={parsedData.url || ""} onChange={handleChange} onKeyDown={handleKeyDown} />
    {getAppearanceFields(["border", "background", "height", "min", "max", "margin", "padding", "width"])}
  </>);

  const getStreamFields = () => {
    let blockField = <></>
    if (parsedData.offlineContent==="block")  {
      let options: React.ReactElement[] = [];
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
        {getAppearanceFields(["border", "background", "color", "font", "height", "min", "max", "line", "margin", "padding", "width"])}
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
      {getAppearanceFields(["border", "background", "color", "font", "height", "min", "max", "line", "margin", "padding", "width"])}
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
      {getAppearanceFields(["border", "background", "color", "font", "height", "min", "max", "line", "margin", "padding", "width"])}
    </>

  )

  const getRawHTML = () => (
    <>
      <TextField fullWidth label="HTML Content" name="rawHTML" onChange={handleChange} value={parsedData.rawHTML || ""} multiline minRows={7} maxRows={15} />
      <TextField fullWidth label="Javascript (exlude <script> tag)" name="javascript" onChange={handleChange} value={parsedData.javascript || ""} multiline minRows={7} maxRows={15} />
    </>
  )

  const getMapFields = () => (
    <>
      <TextField fullWidth size="small" label="Address" name="mapAddress" onChange={handleChange} value={parsedData.mapAddress || ""} helperText="ex: City Hall, New York, NY" />
      <TextField fullWidth size="small" label="Label" name="mapLabel" onChange={handleChange} value={parsedData.mapLabel || ""} helperText="ex: First Baptist Church" />
      <Typography fontSize="13px" sx={{marginTop: 1}}>Zoom-level</Typography>
      <Slider defaultValue={15} valueLabelDisplay="auto" step={1} min={8} max={20} name="mapZoom" value={parsedData?.mapZoom || 15} onChange={(e: any) => handleChange(e)} />
      <Typography fontSize="12px" fontStyle="italic">Ex: 0(the whole world) & 21(individual buildings)</Typography>
    </>
  )

  const getGroupListFields = () => (
    <>
      <TextField fullWidth size="small" label="Label" name="label" onChange={handleChange} value={parsedData.label || ""} helperText="ex: Small Groups, Sunday School" />
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
      <Button variant="contained" onClick={() => setSelectPhotoField("photo")} data-testid="select-photo-button" aria-label="Select photo">Select photo</Button>
      <TextField fullWidth size="small" label="Photo Label" name="photoAlt"  value={parsedData.photoAlt || ""} onChange={handleChange} onKeyDown={handleKeyDown} />
      <TextField fullWidth size="small" label="Link Url (optional)" name="url" value={parsedData.url || ""} onChange={handleChange} onKeyDown={handleKeyDown} />
      <FormGroup sx={{ marginLeft: 0.5}}>
        <FormControlLabel control={<Checkbox size="small" onChange={handleCheck} checked={parsedData.external === "true" ? true : false} />} name="external" label="Open link in new tab" />
        <FormControlLabel control={<Checkbox size="small" onChange={handleCheck} checked={parsedData.noResize === "true" ? true : false} />} name="noResize" label="Do not resize image" />
      </FormGroup>
      <FormControl fullWidth sx={{ marginTop: 2 }}>
        <InputLabel>Image Alignment</InputLabel>
        <Select fullWidth size="small" label="Image Alignment" name="imageAlign" value={parsedData.imageAlign || "left"} onChange={handleChange}>
          <MenuItem value="left">Left</MenuItem>
          <MenuItem value="center">Center</MenuItem>
          <MenuItem value="right">Right</MenuItem>
        </Select>
      </FormControl>
      {getAppearanceFields(["border", "background", "color", "height", "margin", "padding", "width"])}
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
      case "row": result = <><RowEdit parsedData={parsedData} onRealtimeChange={handleRowChange} setErrors={setInnerErrors} />{getAppearanceFields(["border", "background", "color", "font", "height", "line", "margin", "padding", "width"])}</>; break;
      case "table": result = <><TableEdit parsedData={parsedData} onRealtimeChange={handleRowChange} />{getAppearanceFields(["border", "background", "color", "font", "height", "line", "margin", "padding", "width"])}</>; break;
      case "box": result = getBoxFields(); break;
      case "text": result = getTextFields(); break;
      case "textWithPhoto": result = getTextWithPhotoFields(); break;
      case "card": result = getCardFields(); break;
      case "logo": result = getLogoFields(); break;
      case "donation": result = <></>; break;
      case "donateLink": result = <><DonateLinkEdit parsedData={parsedData} onRealtimeChange={handleRowChange} />{getAppearanceFields(["border"])}</>; break;
      case "stream": result = getStreamFields(); break;
      case "iframe": result = getIframeFields(); break;
      case "buttonLink": result = getButtonLink(); break;
      case "video": result = getVideoFields(); break;
      case "rawHTML": result = getRawHTML(); break;
      case "form": result = <><FormEdit parsedData={parsedData} handleChange={handleChange} />{getAppearanceFields(["border", "background", "color", "font", "height", "line", "margin", "padding", "width"])}</>; break;
      case "faq": result = <><FaqEdit parsedData={parsedData} handleChange={handleChange} handleMarkdownChange={handleMarkdownChange} />{getAppearanceFields(["border", "background", "color", "font", "height", "line", "margin", "padding", "width"])}</>; break;
      case "map": result = getMapFields(); break;
      case "sermons": result = <></>; break;
      case "carousel": result = getCarouselFields(); break;
      case "image": result = getImageFields(); break;
      case "whiteSpace": result = getWhiteSpaceFields(); break;
      case "calendar": result = <><CalendarElementEdit parsedData={parsedData} handleChange={handleChange} />{getAppearanceFields(["border", "background", "color", "font", "height", "line", "margin", "padding", "width"])}</>; break;
      case "groupList": result = getGroupListFields(); break;
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
    let options: React.ReactElement[] = [];
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

  const handleDuplicate = (e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm("Are you sure you wish to make a copy of this element and all of it's children?")) {
      ApiHelper.post("/elements/duplicate/" + props.element.id, {}, "ContentApi").then((data) => {
        props.updatedCallback(data);
      });
    }
  }

  if (!element) return <></>
  else return (
    <Dialog open={true} onClose={handleCancel} fullWidth maxWidth="md" id="elementEditDialog">
      <InputBox id="dialogForm" headerText="Edit Element" headerIcon="school" saveFunction={handleSave} cancelFunction={handleCancel} deleteFunction={handleDelete} headerActionContent={(props.element.id && <a href="about:blank" onClick={handleDuplicate}>Duplicate</a>)} data-testid="edit-element-inputbox">
        <div id="dialogFormContent">
          {(element?.elementType === "block") ? getBlockFields() : getStandardFields()}
        </div>
      </InputBox>
      {selectPhotoField && <GalleryModal onClose={() => setSelectPhotoField(null)} onSelect={handlePhotoSelected} aspectRatio={0} />}
    </Dialog>
  );
}
