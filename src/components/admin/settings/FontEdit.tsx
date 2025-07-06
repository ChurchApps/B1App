import React, { useState, useEffect } from "react";
import { Button, Grid, SelectChangeEvent } from "@mui/material";
import { GlobalStyleInterface } from "@/helpers";
import { DisplayBox } from "@churchapps/apphelper/dist/components/DisplayBox";
import { InputBox } from "@churchapps/apphelper/dist/components/InputBox";
import { CustomFontModal } from "@/app/[sdSlug]/admin/site/styles/CustomFontModal";

interface Props {
  globalStyle?: GlobalStyleInterface;
  updatedFunction?: (fontsJson:string) => void;
}

export interface FontsInterface {
  body: string;
  heading: string;
}

export function FontsEdit(props: Props) {
  const [fonts, setFonts] = useState<FontsInterface>(null);
  const [showFont, setShowFont] = useState("");

  const fontList = ["Open Sans", "Montserrat", "Oswald", "Roboto", "Poppins", "Playfair Display", "Lato", "Raleway", "Inter"]

  useEffect(() => {
    if (props.globalStyle) setFonts(JSON.parse(props.globalStyle.fonts));
  }, [props.globalStyle]);

  const handleSave = () => { props.updatedFunction(JSON.stringify(fonts)); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement> | SelectChangeEvent<string>) => {
    const val = e.target.value;
    let f = { ...fonts };
    switch (e.target.name) {
      case "body": f.body = val; break;
      case "heading": f.heading = val; break;
    }
    setFonts(f);
  };

  const updateFont = (font:string) => {
    let f = { ...fonts };
    if (showFont === "body") f.body = font;
    else f.heading = font;
    setFonts(f);
  }


  const getPairings = () => {
    let result:React.ReactElement[] = [];

    fontList.forEach(heading => {
      result.push(<Grid item xs={12} md={6}>
        <div style={{border:"1px solid black", borderRadius:5, paddingLeft:10}}>
          <h2 style={{fontFamily:heading}}>{heading} Heading</h2>
          {
            fontList.map(body => <a href="about:blank" onClick={(e) => { e.preventDefault(); setFonts({body, heading}); }} style={{color:"#000000"}}>
              <p style={{fontFamily:body}}>Click for {heading} heading with {body} body.</p>
            </a>)
          }
        </div>
      </Grid>)
    })

    return <Grid container spacing={1}>{result}</Grid>
  }


  const getFont = () => {
    if (showFont) return <CustomFontModal onClose={() => { setShowFont("") }} updateValue={(val) => { setShowFont(""); updateFont(val) }} />
  }

  if (!fonts) return "Fonts null";


  return (
    <>
      {getFont()}
      <InputBox headerIcon="text_fields" headerText="Edit Color Palette" saveFunction={handleSave} cancelFunction={() => props.updatedFunction(null)} data-testid="font-edit-inputbox">
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <div><label>Heading Font</label></div>
            <Button variant="outlined" onClick={(e) => { e.preventDefault(); setShowFont("heading"); }} data-testid="heading-font-button">{fonts.heading || "Roboto"}</Button>
          </Grid>
          <Grid item xs={12} md={4}>
            <div><label>Body Font</label></div>
            <Button variant="outlined" onClick={(e) => { e.preventDefault(); setShowFont("body"); }} data-testid="body-font-button">{fonts.body || "Roboto"}</Button>
          </Grid>
          <Grid item xs={12} md={4}>

          </Grid>
        </Grid>
        <h2 style={{fontFamily:fonts.heading}}>Heading Preview</h2>
        <p style={{fontFamily:fonts.body}}>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Rhoncus urna neque viverra justo nec ultrices dui sapien. Faucibus pulvinar elementum integer enim neque volutpat ac tincidunt. Pulvinar mattis nunc sed blandit libero volutpat sed cras.</p>
        <h3 style={{fontFamily:fonts.heading}}>Smaller Heading</h3>
        <p style={{fontFamily:fonts.body}}>Faucibus purus in massa tempor. Venenatis lectus magna fringilla urna porttitor rhoncus dolor purus non. Accumsan tortor posuere ac ut. Sit amet facilisis magna etiam. In aliquam sem fringilla ut. Aenean sed adipiscing diam donec adipiscing tristique risus nec. Diam maecenas sed enim ut sem viverra aliquet eget.</p>

      </InputBox>
      <DisplayBox headerIcon="text_fields" headerText="Sample Pairings" editContent={false}>
        {getPairings()}
      </DisplayBox>
    </>
  );
}
