import { GlobalStyleInterface } from '@/helpers';
import { GalleryModal } from '@churchapps/apphelper';
import { FormControl, InputLabel, Select, MenuItem, TextField, Button, SelectChangeEvent } from '@mui/material';
import { useState } from 'react';
import { SliderPicker } from 'react-color';

type Props = {
  background:string;
  textColor:string;
  updatedCallback: (background:string, textColor:string) => void;
  globalStyles: GlobalStyleInterface;
};

export function PickColors(props: Props) {
  const [customColors, setCustomColors] = useState(false);
  const [selectPhotoField, setSelectPhotoField] = useState<string>(null);


  const handlePhotoSelected = (image: string) => {
    props.updatedCallback(image, props.textColor);
    setSelectPhotoField(null);
  }


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    e.preventDefault();
    const val = e.target.value;
    switch (e.target.name) {
      case "background": props.updatedCallback(val, props.textColor); break;
      case "backgroundType":
        switch (val) {
          case "image":
            props.updatedCallback("https://content.churchapps.org/stockPhotos/4/bible.png", props.textColor)
            break;
          case "youtube":
            props.updatedCallback("youtube:3iXYciBTQ0c", props.textColor)
            break;
          default:
            props.updatedCallback("#000000", props.textColor)
            break;
        }
      case "textColor": props.updatedCallback(props.background, val); break;
      case "youtubeId": props.updatedCallback("youtube:" + val, props.textColor); break;
    }

  };

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
      const style: any = { backgroundColor: c, width: "100%", height: (props[field] === v) ? 20 : 12, display: "block" }
      if (c === "#FFFFFF" || v === "var(--light)") style.border = "1px solid #999";
      result.push(<td><a href="about:blank" style={style} onClick={(e) => { e.preventDefault(); if (field==="background") props.updatedCallback(v, props.textColor); else props.updatedCallback(props.background, v); }}>&nbsp;</a></td>);
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
    let backgroundType = "image";
    if (props.background?.startsWith("#") || props.background?.startsWith("var(") ) backgroundType = "color";
    else if (props.background?.startsWith("youtube")) backgroundType = "youtube"

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
      result.push(<SliderPicker key="sliderPicker" color={props.background} onChangeComplete={(color) => { if (color.hex !== "#000000") props.updatedCallback(color.hex, props.textColor)  }} />);
      result.push(getGrayOptions())
      result.push(getThemeOptions())
      result.push(<TextField key="backgroundText" fullWidth size="small" label="Background" name="background" value={props.background} onChange={handleChange} />)
    } else if (backgroundType === "youtube") {
      const parts = props.background.split(":");
      const youtubeId = (parts.length > 1) ? parts[1] : "";
      result.push(<>
        <TextField fullWidth size="small" label="Youtube ID" name="youtubeId" value={youtubeId} onChange={handleChange}  />
      </>)
    } else if (backgroundType === "image") {
      result.push(<>
        <img src={props.background} style={{ maxHeight: 100, maxWidth: "100%", width: "auto" }} alt="background image" /><br />
        <Button variant="contained" onClick={() => setSelectPhotoField("photo")}>Select photo</Button>
      </>)
    }

    return (
      <>{result}</>
    );
  }

  //

  const selectPairing = ( pair:string[]) => {
    props.updatedCallback("var(--" + pair[0] + ")", "var(--" + pair[1] + ")");
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

    const suggestions:JSX.Element[] = [];

    pairings.forEach(p => {
      const b = colors[p[0]]
      const t = colors[p[1]]
      suggestions.push(<a href="about:blank" onClick={(e) => {e.preventDefault(); selectPairing(p); }} style={{display:"block", backgroundColor:b, color:t, border:"1px solid " + t, borderRadius:5, padding:5, marginBottom:3 }}>Sample Text</a>);
    });


    return (<>
      <a href="about:blank" onClick={(e) => { e.preventDefault(); setCustomColors(true); }}>Manually Select Colors</a><br />
      <h4>Current Colors</h4>
      <div style={{display:"block", backgroundColor:props.background, color:props.textColor, border:"1px solid " + props.textColor, borderRadius:5, padding:5, marginBottom:10 }}>Sample Text</div>

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
  </>)

  return <>
    {(customColors) ? getManualColors() : getSuggestedColors() }
    {selectPhotoField && <GalleryModal onClose={() => setSelectPhotoField(null)} onSelect={handlePhotoSelected} aspectRatio={0} />}
  </>;
}
