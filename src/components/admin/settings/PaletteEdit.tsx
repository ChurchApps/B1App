import { useState, useEffect } from "react";
import { Grid, Table, TableCell, TableRow, TextField } from "@mui/material";
import { GlobalStyleInterface } from "@/helpers";
import { InputBox } from "@churchapps/apphelper";

interface Props {
  globalStyle?: GlobalStyleInterface;
  updatedFunction?: (paletteJson:string) => void;
}

export interface PaletteInterface {
  light: string;
  lightAccent: string;
  accent: string;
  darkAccent: string;
  dark: string;
}

export function PaletteEdit(props: Props) {
  const [palette, setPalette] = useState<PaletteInterface>(null);

  const pairings = [
    { background: "light", text: "lightAccent" },
    { background: "light", text: "accent" },
    { background: "light", text: "darkAccent" },
    { background: "light", text: "dark" },
    { background: "lightAccent", text: "light" },
    { background: "lightAccent", text: "accent" },
    { background: "lightAccent", text: "darkAccent" },
    { background: "lightAccent", text: "dark" },
    { background: "accent", text: "light" },
    { background: "accent", text: "lightAccent" },
    { background: "accent", text: "darkAccent" },
    { background: "accent", text: "dark" },
    { background: "darkAccent", text: "light" },
    { background: "darkAccent", text: "lightAccent" },
    { background: "darkAccent", text: "accent" },
    { background: "darkAccent", text: "dark" },
    { background: "dark", text: "light" },
    { background: "dark", text: "lightAccent" },
    { background: "dark", text: "accent" },
    { background: "dark", text: "darkAccent" },
  ]

  const suggestions = [
    { light: "#ffffff", lightAccent: "#dddddd", accent: "#dd0000", darkAccent: "#dd9999", dark: "#000000" },
    { light: "#faffff", lightAccent: "#7db8d6", accent: "#a77b60", darkAccent: "#37515e", dark: "#19191b" },
    { light: "#ffffff", lightAccent: "#e2dbe9", accent: "#5a4565", darkAccent: "#3e204f", dark: "#000000" },
    { light: "#ffffff", lightAccent: "#beccae", accent: "#506545", darkAccent: "#314f20", dark: "#000000" },
    { light: "#ffffff", lightAccent: "#aecccc", accent: "#455f65", darkAccent: "#20474f", dark: "#000000" },
    { light: "#ffffff", lightAccent: "#aebdcc", accent: "#454f65", darkAccent: "#20304f", dark: "#000000" },
    { light: "#ffffff", lightAccent: "#e4b0db", accent: "#925b7e", darkAccent: "#88366d", dark: "#000000" },
    { light: "#ffffff", lightAccent: "#de95a1", accent: "#944946", darkAccent: "#901e1e", dark: "#000000" },
    { light: "#ffffff", lightAccent: "#28c4f4", accent: "#f25822", darkAccent: "#0b4a7f", dark: "#000000" },
    { light: "#ffffff", lightAccent: "#efb302", accent: "#da3a2a", darkAccent: "#2f5095", dark: "#000000" },
    { light: "#ffffff", lightAccent: "#d4eb76", accent: "#5cb772", darkAccent: "#2f65af", dark: "#000000" },
    { light: "#ffffff", lightAccent: "#d6edfb", accent: "#5bc5ed", darkAccent: "#019cdf", dark: "#000000" },
    { light: "#ffffff", lightAccent: "#f6e43a", accent: "#328a3c", darkAccent: "#c70922", dark: "#000000" },
    { light: "#ffffff", lightAccent: "#ff9900", accent: "#cd0104", darkAccent: "#010066", dark: "#000000" },
    { light: "#ffffff", lightAccent: "#9cbe2b", accent: "#6ea501", darkAccent: "#004300", dark: "#000000" },
    { light: "#ffffff", lightAccent: "#ffb516", accent: "#ff640a", darkAccent: "#c90217", dark: "#000000" }
  ]


  useEffect(() => {
    if (props.globalStyle) setPalette(JSON.parse(props.globalStyle.palette));
  }, [props.globalStyle]);

  const handleSave = () => { props.updatedFunction(JSON.stringify(palette)); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    let p = { ...palette };
    switch (e.target.name) {
      case "light": p.light = val; break;
      case "lightAccent": p.lightAccent = val; break;
      case "accent": p.accent = val; break;
      case "darkAccent": p.darkAccent = val; break;
      case "dark": p.dark = val; break;
    }
    setPalette(p);
  };

  const getCell = (name:string, color:string) => <TableCell style={{backgroundColor:color}}>&nbsp;</TableCell>

  const getPalette = (p: PaletteInterface) => {
    let result = <a href="about:blank" onClick={(e) => { e.preventDefault(); setPalette(p); }}>
      <Table>
        <TableRow>
          {getCell("light", p.light)}
          {getCell("lightAccent", p.lightAccent)}
          {getCell("accent", p.accent)}
          {getCell("darkAccent", p.darkAccent)}
          {getCell("dark", p.dark)}
        </TableRow>
      </Table>
    </a>
    return result;
  }

  const getPalettes = () => {
    let result:JSX.Element[] = [];
    suggestions.forEach(s => {
      result.push(<Grid item xs={12} md={6}>{getPalette(s)}</Grid>)
    })
    return <Grid container spacing={3}>{result}</Grid>
  }

  const getPairings = () => {
    let result:JSX.Element[] = [];
    pairings.forEach(p => {
      const backgroundName = p.background as keyof PaletteInterface;
      const textName = p.text as keyof PaletteInterface;
      const bg = palette[backgroundName];
      const text = palette[textName];
      result.push(<Grid item xs={12} md={6}><div style={{backgroundColor:bg, color:text, border:"1px solid " + text, padding:10}}>{p.background +"-" + p.text}</div></Grid>)
    })
    return <Grid container spacing={1}>{result}</Grid>
  }

  if (!palette) return null;


  return (
    <>
      <InputBox headerIcon="folder" headerText="Edit Color Palette" saveFunction={handleSave} cancelFunction={() => props.updatedFunction(null)}>
        <Table style={{width:"100%"}}>
          <TableRow>
            <TableCell><TextField type="color" label="Light" fullWidth name="light" value={palette.light} onChange={handleChange} /></TableCell>
            <TableCell><TextField type="color" label="Light Accent" fullWidth name="lightAccent" value={palette.lightAccent} onChange={handleChange} /></TableCell>
            <TableCell><TextField type="color" label="Accent" fullWidth name="accent" value={palette.accent} onChange={handleChange} /></TableCell>
            <TableCell><TextField type="color" label="Dark Accent" fullWidth name="darkAccent" value={palette.darkAccent} onChange={handleChange} /></TableCell>
            <TableCell><TextField type="color" label="Dark" fullWidth name="dark" value={palette.dark} onChange={handleChange} /></TableCell>
          </TableRow>
        </Table>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <h2>Suggested Pallets</h2>
            {getPalettes()}
          </Grid>
          <Grid item xs={12} md={6}>
            <h2>Pairings</h2>
            {getPairings()}
          </Grid>
        </Grid>

      </InputBox>
    </>
  );
}
