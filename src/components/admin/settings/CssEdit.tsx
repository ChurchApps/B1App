import { useState, useEffect } from "react";
import { TextField } from "@mui/material";
import { GlobalStyleInterface } from "@/helpers";
import { InputBox } from "@churchapps/apphelper/dist/components/InputBox";

interface Props {
  globalStyle?: GlobalStyleInterface;
  updatedFunction?: (globalStyle:GlobalStyleInterface) => void;
}


export function CssEdit(props: Props) {
  const [globalStyle, setGlobalStyle] = useState<GlobalStyleInterface>(null);

  useEffect(() => { if (props.globalStyle) setGlobalStyle({...props.globalStyle}); }, [props.globalStyle]);

  const handleSave = () => { props.updatedFunction(globalStyle); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    let gs = { ...globalStyle };
    switch (e.target.name) {
      case "css": gs.customCss = val; break;
      case "js": gs.customJS = val; break;
    }
    setGlobalStyle(gs);
  };



  if (!globalStyle) return null;


  return (
    <>

      <InputBox headerIcon="text_fields" headerText="Edit Color Palette" saveFunction={handleSave} cancelFunction={() => props.updatedFunction(null)}>
        <TextField multiline rows={5} label="Custom CSS" name="css" value={globalStyle.customCss || ""} onChange={handleChange} fullWidth placeholder="a { text-decoration:underline; }" />
        <TextField multiline rows={5} label="Custom Javascript" name="js" value={globalStyle.customJS || ""} onChange={handleChange} fullWidth placeholder="<script>console.log('Hello World');</script>" />
      </InputBox>
    </>
  );
}
