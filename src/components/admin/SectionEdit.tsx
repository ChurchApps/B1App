import { useState, useEffect } from "react";
import { ErrorMessages, InputBox } from "../index";
import { ApiHelper, ArrayHelper, BlockInterface, SectionInterface } from "@/helpers";
import { Button, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, TextField } from "@mui/material";
import { GalleryModal } from "@/appBase/components/gallery/GalleryModal";
import { CompactPicker, HuePicker, MaterialPicker, SliderPicker } from 'react-color'

type Props = {
  section: SectionInterface;
  updatedCallback: (section: SectionInterface) => void;
};

export function SectionEdit(props: Props) {
  const [blocks, setBlocks] = useState<BlockInterface[]>(null);
  const [section, setSection] = useState<SectionInterface>(null);
  const [errors, setErrors] = useState([]);
  const [selectPhotoField, setSelectPhotoField] = useState<string>(null);

  const handleCancel = () => props.updatedCallback(section);
  const handleKeyDown = (e: React.KeyboardEvent<any>) => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    e.preventDefault();
    let p = { ...section };
    const val = e.target.value;
    switch (e.target.name) {
      case "background": p.background = val; break;
      case "backgroundType": p.background = (val === "image") ? "https://content.churchapps.org/stockPhotos/4/bible.png" : "#000000"
      case "textColor": p.textColor = val; break;
      case "targetBlockId": p.targetBlockId = val; break;
    }
    setSection(p);
  };

  const handlePhotoSelected = (image: string) => {
    let s = { ...section };
    s.background = image;
    setSection(s);
    setSelectPhotoField(null);
  }

  const validate = () => {
    let errors = [];
    setErrors(errors);
    return errors.length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      ApiHelper.post("/sections", [section], "ContentApi").then((data) => {
        setSection(data);
        props.updatedCallback(data);
      });
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you wish to permanently delete this section?")) {
      ApiHelper.delete("/sections/" + section.id.toString(), "ContentApi").then(() => props.updatedCallback(null));
    }
  };

  const loadBlocks = async () => {
    if (props.section.targetBlockId) {
      let result: BlockInterface[] = await ApiHelper.get("/blocks", "ContentApi");
      setBlocks(ArrayHelper.getAll(result, "blockType", "sectionBlock"));
    }
  }

  useEffect(() => { setSection(props.section); loadBlocks() }, [props.section]);

  const BackgroundField = () => {
    //{ parsedData.photo && <><img src={parsedData.photo} style={{ maxHeight: 100, maxWidth: "100%", width: "auto" }} /><br /></> }
    //<Button variant="contained" onClick={() => setSelectPhotoField("photo")}>Select photo</Button>

    const backgroundType = section.background?.startsWith("#") ? "color" : "image";

    let result: JSX.Element[] = [
      <FormControl fullWidth>
        <InputLabel>Background Type</InputLabel>
        <Select fullWidth label="Background Type" name="backgroundType" value={backgroundType} onChange={handleChange}>
          <MenuItem value="color">Color</MenuItem>
          <MenuItem value="image">Image</MenuItem>
        </Select>
      </FormControl>
    ];

    if (backgroundType === "color") {
      result.push(<>
        <SliderPicker color={section.background} onChangeComplete={(color) => { if (color.hex !== "#000000") { let s = { ...section }; s.background = color.hex; setSection(s); } }} />
        <TextField fullWidth label="Background" name="background" value={section.background} onChange={handleChange} onKeyDown={handleKeyDown} />
      </>);
    } else {
      result.push(<>
        <img src={section.background} style={{ maxHeight: 100, maxWidth: "100%", width: "auto" }} /><br />
        <Button variant="contained" onClick={() => setSelectPhotoField("photo")}>Select photo</Button>
      </>)
    }

    return (
      <>{result}</>
    );
  }

  const StandardFields = () => {
    return (<>
      <ErrorMessages errors={errors} />
      <br />
      <BackgroundField />
      <FormControl fullWidth>
        <InputLabel>Text Color</InputLabel>
        <Select fullWidth label="Text Color" name="textColor" value={section.textColor || ""} onChange={handleChange}>
          <MenuItem value="light">Light</MenuItem>
          <MenuItem value="dark">Dark</MenuItem>
        </Select>
      </FormControl>
    </>)
  }

  const BlockFields = () => {
    let options: JSX.Element[] = [];
    blocks.forEach(b => {
      options.push(<MenuItem value={b.id}>{b.name}</MenuItem>)
    });
    return (<>
      <FormControl fullWidth>
        <InputLabel>Block</InputLabel>
        <Select fullWidth label="Block" name="targetBlockId" value={section.targetBlockId || ""} onChange={handleChange}>
          {options}
        </Select>
      </FormControl>
    </>)
  }

  const Fields = () => (
    (section?.targetBlockId) ? <BlockFields /> : <StandardFields />
  )



  if (!section) return <></>
  else return (
    <>
      <InputBox id="sectionDetailsBox" headerText="Edit Section" headerIcon="school" saveFunction={handleSave} cancelFunction={handleCancel} deleteFunction={handleDelete} >
        <Fields />
      </InputBox>
      {selectPhotoField && <GalleryModal onClose={() => setSelectPhotoField(null)} onSelect={handlePhotoSelected} aspectRatio={4} />}
    </>
  );
}