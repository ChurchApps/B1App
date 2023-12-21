import { useState, useEffect } from "react";
import { ErrorMessages, InputBox, GalleryModal, ApiHelper, ArrayHelper } from "@churchapps/apphelper";
import { BlockInterface, GlobalStyleInterface, SectionInterface } from "@/helpers";
import { Button, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, TextField } from "@mui/material";
import { SliderPicker } from 'react-color'

type Props = {
  section: SectionInterface;
  updatedCallback: (section: SectionInterface) => void;
  globalStyles: GlobalStyleInterface;
};

export function SectionEdit(props: Props) {
  const [blocks, setBlocks] = useState<BlockInterface[]>(null);
  const [section, setSection] = useState<SectionInterface>(null);
  const [errors, setErrors] = useState([]);
  const [customColors, setCustomColors] = useState(false);
  const [selectPhotoField, setSelectPhotoField] = useState<string>(null);
  let parsedData = (section?.answersJSON) ? JSON.parse(section.answersJSON) : {}

  const handleCancel = () => props.updatedCallback(section);
  const handleKeyDown = (e: React.KeyboardEvent<any>) => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    e.preventDefault();
    let p = { ...section };
    const val = e.target.value;
    switch (e.target.name) {
      case "background": p.background = val; break;
      case "backgroundType":
        switch (val) {
          case "image":
            p.background = "https://content.churchapps.org/stockPhotos/4/bible.png"
            break;
          case "youtube":
            p.background = "youtube:3iXYciBTQ0c";
            break;
          default:
            p.background = "#000000"
            break;
        }
      case "textColor": p.textColor = val; break;
      case "targetBlockId": p.targetBlockId = val; break;
      case "youtubeId": p.background = "youtube:" + val; break;
      default:
        parsedData[e.target.name] = val;
        p.answersJSON = JSON.stringify(parsedData);
        break;
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
    let errors:string[] = [];
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


  useEffect(() => {
    const loadBlocks = async () => {
      if (props.section.targetBlockId) {
        let result: BlockInterface[] = await ApiHelper.get("/blocks", "ContentApi");
        setBlocks(ArrayHelper.getAll(result, "blockType", "sectionBlock"));
      }
    }

    setSection(props.section);
    loadBlocks();
  }, [props.section]);

  const getGrayOptions = () => {
    let colors = ["#FFFFFF", "#CCCCCC", "#888888", "#444444", "#000000"]
    return getManualOptions(colors, colors, "background");
  }

  const getThemeOptions = (field:"background" | "textColor" =  "background") => {
    if (props.globalStyles?.palette)
    {
      const palette = JSON.parse(props.globalStyles.palette);
      let colors = [palette.light, palette.lightAccent, palette.accent, palette.darkAccent, palette.dark]
      return getManualOptions(colors, ["var(--light)", "var(--lightAccent)", "var(--accent)", "var(--darkAccent)", "var(--dark)"], field);
    }
  }

  const getManualOptions = (colors:string[], values:string[], field:"background" | "textColor") => {
    let result: JSX.Element[] = [];
    colors.forEach((c, i) => {
      const v = values[i];
      const style: any = { backgroundColor: c, width: "100%", height: (section[field] === v) ? 20 : 12, display: "block" }
      if (c === "#FFFFFF" || v === "var(--light)") style.border = "1px solid #999";
      result.push(<td><a href="about:blank" style={style} onClick={(e) => { e.preventDefault(); let s = { ...section }; s[field] = v; setSection(s); }}>&nbsp;</a></td>);
    })
    return (<table style={{ width: "100%", marginTop: 10 }} key="grayColors">
      <tbody>
        <tr>
          {result}
        </tr>
      </tbody>
    </table>);
  }

  const getBackgroundField = () => {
    //{ parsedData.photo && <><img src={parsedData.photo} style={{ maxHeight: 100, maxWidth: "100%", width: "auto" }} /><br /></> }
    //<Button variant="contained" onClick={() => setSelectPhotoField("photo")}>Select photo</Button>

    let backgroundType = "image";
    if (section.background?.startsWith("#") || section.background?.startsWith("var(") ) backgroundType = "color";
    else if (section.background?.startsWith("youtube")) backgroundType = "youtube"

    let result: JSX.Element[] = [
      <FormControl fullWidth>
        <InputLabel>Background Type</InputLabel>
        <Select fullWidth size="small" label="Background Type" name="backgroundType" value={backgroundType} onChange={handleChange}>
          <MenuItem value="color">Color</MenuItem>
          <MenuItem value="image">Image</MenuItem>
          <MenuItem value="youtube">Youtube Video</MenuItem>
        </Select>
      </FormControl>
    ];

    if (backgroundType === "color") {
      result.push(<SliderPicker key="sliderPicker" color={section.background} onChangeComplete={(color) => { if (color.hex !== "#000000") { let s = { ...section }; s.background = color.hex; setSection(s); } }} />);
      result.push(getGrayOptions())
      result.push(getThemeOptions())
      result.push(<TextField key="backgroundText" fullWidth size="small" label="Background" name="background" value={section.background} onChange={handleChange} onKeyDown={handleKeyDown} />)
    } else if (backgroundType === "youtube") {
      const parts = section.background.split(":");
      const youtubeId = (parts.length > 1) ? parts[1] : "";
      result.push(<>
        <TextField fullWidth size="small" label="Youtube ID" name="youtubeId" value={youtubeId} onChange={handleChange} onKeyDown={handleKeyDown} />
      </>)
    } else if (backgroundType === "image") {
      result.push(<>
        <img src={section.background} style={{ maxHeight: 100, maxWidth: "100%", width: "auto" }} alt="background image" /><br />
        <Button variant="contained" onClick={() => setSelectPhotoField("photo")}>Select photo</Button>
      </>)
    }

    return (
      <>{result}</>
    );
  }

  const selectPairing = ( pair:string[]) => {
    let s = { ...section };
    s.background = "var(--" + pair[0] + ")";
    s.textColor = "var(--" + pair[1] + ")";
    setSection(s);

  }

  const getRGB = (hex:string) => {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    return {r:r, g:g, b:b};
  }

  const enoughContrast = (rgb1:any, rgb2:any) => {
    const contrastR = Math.abs(rgb1.r - rgb2.r);
    const contrastG = Math.abs(rgb1.r - rgb2.r);
    const contrastB = Math.abs(rgb1.r - rgb2.r);
    return ((contrastR + contrastG + contrastB) > 250 );
  }

  const getSuggestedColors = () => {
    const colors = JSON.parse(props.globalStyles.palette);
    const pairings:any[] = []
    const names = ["light", "lightAccent", "accent", "darkAccent", "dark"];
    names.forEach(nb => {
      names.forEach(nt => {
        const rgbB = getRGB(colors[nb]);
        const rgbT = getRGB(colors[nt]);
        if (enoughContrast(rgbB, rgbT)) pairings.push([nb, nt]);
      });

    });
    /*
    const pairings = [
      ["light", "dark"],
      ["light", "darkAccent"],
      ["light", "accent"],
      ["lightAccent", "dark"],
      ["lightAccent", "darkAccent"],
      ["lightAccent", "accent"],
      ["accent", "dark"],
      ["accent", "darkAccent"],
      ["accent", "accent"],
      ["darkAccent", "dark"],
      ["darkAccent", "darkAccent"],
      ["darkAccent", "accent"]
    ];*/
    const suggestions:JSX.Element[] = [];

    pairings.forEach(p => {
      const b = colors[p[0]]
      const t = colors[p[1]]
      suggestions.push(<a href="about:blank" onClick={(e) => {e.preventDefault(); selectPairing(p); }} style={{display:"block", backgroundColor:b, color:t, border:"1px solid " + t, borderRadius:5, padding:5, marginBottom:3 }}>Sample Text</a>);
    });


    return (<>
      <a href="about:blank" onClick={(e) => { e.preventDefault(); setCustomColors(true); }}>Manually Select Colors</a><br />
      <h4>Current Colors</h4>
      <div style={{display:"block", backgroundColor:section?.background, color:section?.textColor, border:"1px solid " + section?.textColor, borderRadius:5, padding:5, marginBottom:10 }}>Sample Text</div>

      <h4>Suggestions</h4>
      {suggestions}
    </>)
  }

  const getManualColors = () => (<>
    <a href="about:blank" onClick={(e) => { e.preventDefault(); setCustomColors(false); }}>Browse Suggested Colors</a><br />
    {getBackgroundField()}
    <div>
      <InputLabel>Text Color</InputLabel>
    </div>
    {getThemeOptions("textColor")}
    <TextField fullWidth size="small" label="ID" name="sectionId" value={parsedData.sectionId || ""} onChange={handleChange} />
  </>)

  const getStandardFields = () => (<>
    <ErrorMessages errors={errors} />
    <br />
    {(customColors) ? getManualColors() : getSuggestedColors() }
  </>)

  const getBlockFields = () => {
    let options: JSX.Element[] = [];
    blocks?.forEach(b => {
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

  if (!section) return <></>
  else return (
    <>
      <InputBox id="sectionDetailsBox" headerText="Edit Section" headerIcon="school" saveFunction={handleSave} cancelFunction={handleCancel} deleteFunction={handleDelete}>
        {(section?.targetBlockId) ? getBlockFields() : getStandardFields()}
      </InputBox>
      {selectPhotoField && <GalleryModal onClose={() => setSelectPhotoField(null)} onSelect={handlePhotoSelected} aspectRatio={0} />}
    </>
  );
}

