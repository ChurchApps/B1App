import React, { useEffect, useState } from "react";
import { Grid, TextField } from "@mui/material";
import Resizer from "react-image-file-resizer";
import { GenericSettingInterface, ArrayHelper, ApiHelper } from "@/helpers";
import { InputBox } from "..";
import { ImageEditor } from "@/appBase/components";

interface Props {
  updatedFunction?: () => void,
  settings?: GenericSettingInterface[],
}

async function dataUrlToFile ( dataUrl: string, fileName: string ): Promise<File> {
  const res: Response = await fetch(dataUrl);
  const blob: Blob = await res.blob();
  return new File([blob], fileName, { type: 'image/png' });
}

function resizeTo16x16(file: File) {
  return new Promise<string>((resolve, reject) => {
    try {
      Resizer.imageFileResizer(
        file,
        16,
        16,
        "PNG",
        16,
        0,
        (uri) => { resolve(uri.toString()) },
        "base64",
        16,
        16,
      )
    } catch (err) {
      console.error("Error in resizing file")
      reject()
    }
  })
}

export const AppearanceEdit: React.FC<Props> = (props) => {
  const [currentSettings, setCurrentSettings] = React.useState<GenericSettingInterface[]>([]);
  const [editLogo, setEditLogo] = React.useState(false);
  const [currentEditLogo, setCurrentEditLogo] = React.useState<string>("");
  const [currentUrl, setCurrentUrl] = useState("about:blank");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    const settings = [...currentSettings]
    const keySetting = settings.filter(c => c.keyName === name);

    if (keySetting.length === 0) {
      settings.push({ keyName: name, value, public: 1 });
    } else {
      keySetting[0].value = value;
    }

    setCurrentSettings(settings);
  }

  const init = () => {
    let startingUrl = (ArrayHelper.getOne(props.settings, "keyName", currentEditLogo))?.value;
    setCurrentUrl(startingUrl);
  };

  useEffect(init, [currentEditLogo]);

  const get16x16ImageUri = async (dataUrl: string) => {
    const file = await dataUrlToFile(dataUrl, "favicon_16x16");
    const uri = await resizeTo16x16(file);
    return uri;
  }

  const imageUpdated = async (dataUrl: string, keyName: string) => {
    if (dataUrl !== null) {
      const settings = [...currentSettings];
      const keySetting = settings.filter(s => s.keyName === keyName);

      if (keySetting.length === 0) {
        settings.push({ keyName, value: dataUrl, public: 1 });
      } else {
        keySetting[0].value = dataUrl;
      }

      if (keyName === "favicon_400x400") {
        const index = settings.findIndex(s => s.keyName === "favicon_16x16");
        if (dataUrl !== ""){
          const imageDataUrl = await get16x16ImageUri(dataUrl)
          if (index !== -1) {
            settings[index].value = imageDataUrl;
          } else {
            settings.push({ keyName: "favicon_16x16", value: imageDataUrl, public: 1 })
          }
        } else {
          settings[index].value = "";
        }
      }

      setCurrentSettings(settings);
    }
    setEditLogo(false);
    setCurrentUrl(null)
  }

  const getLogoEditor = (logoName: string) => {
    if (!editLogo) {
      return null
    } else {
      return (
        <ImageEditor
          photoUrl={currentUrl}
          onUpdate={(dataUrl) => {
            imageUpdated(dataUrl, logoName)
          }}
          onCancel={() => { 
            setEditLogo(false);
            setCurrentUrl(null);
          }}
          aspectRatio={currentEditLogo.includes("favicon") ? 1 : 4}
          outputWidth={currentEditLogo.includes("favicon") ? 400 : 1200}
          outputHeight={currentEditLogo.includes("favicon") ? 400 : 300}
        />
      )
    }
  }

  const getLogoLink = (name: string, backgroundColor: string) => {
    const logoImage = ArrayHelper.getOne(currentSettings, "keyName", name)
    let logoImg = (currentSettings && logoImage !== null) ? <img src={logoImage.value} alt="logo" style={{ backgroundColor: backgroundColor }} /> : "none";
    return <a href="about:blank" onClick={(e: React.MouseEvent) => { e.preventDefault(); setEditLogo(true); setCurrentEditLogo(name) }}>{logoImg}</a>
  }

  const handleSave = () => { ApiHelper.post("/settings", currentSettings, "MembershipApi").then(props.updatedFunction); }
  const handleCancel = () => { props.updatedFunction(); }

  React.useEffect(() => { setCurrentSettings(props.settings); }, [props.settings]);

  return (
    <>
      {getLogoEditor(currentEditLogo)}
      <InputBox headerIcon="palette" headerText="Church Appearance" saveFunction={handleSave} cancelFunction={handleCancel}>
        <div style={{ backgroundColor: "#EEE", padding: 10 }}>

          <label>Logo - Light background</label><br />
          <p style={{ color: "#999", fontSize: 12 }}>Upload horizontal logo with a transparent background suitable for use of light backrounds. The ideal size is 1280 pixels wide by 320 pixels high.</p>
          {getLogoLink("logoLight", "#EEE")}

        </div>
        <hr />
        <div style={{ backgroundColor: "#333", padding: 10, color: "#FFF" }}>

          <label>Logo - Dark background</label><br />
          <p style={{ color: "#999", fontSize: 12 }}>Upload horizontal logo with a transparent background suitable for use of dark backrounds. The ideal size is 1280 pixels wide by 320 pixels high.</p>
          {getLogoLink("logoDark", "#333")}

        </div>
        <hr />

        <div style={{ backgroundColor: "#bbdefb", padding: 10, color: "#FFF" }}>
          <label>Favicon</label>
          <p style={{ color: "#999", fontSize: 12 }}>Upload square logo with a transparent background.The ideal size is 400 pixels wide by 400 pixels high.</p>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{maxWidth: 150, maxHeight: 150}}>
            {getLogoLink("favicon_400x400", "#bbdefb")}
          </div>
          </div>
        </div>
        <hr />

        <div className="section">Primary Colors</div>
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <TextField type="color" label="Color" fullWidth name="primaryColor" value={(ArrayHelper.getOne(currentSettings, "keyName", "primaryColor"))?.value || "#08A0CC"} onChange={handleChange} />
          </Grid>
          <Grid item xs={6}>
            <TextField type="color" label="Contrast" fullWidth name="primaryContrast" value={(ArrayHelper.getOne(currentSettings, "keyName", "primaryContrast"))?.value || "#FFFFFF"} onChange={handleChange} />
          </Grid>
        </Grid>
        <div className="section">Secondary Colors</div>
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <TextField type="color" label="Color" fullWidth name="secondaryColor" value={(ArrayHelper.getOne(currentSettings, "keyName", "secondaryColor"))?.value || "#FFBA1A"} onChange={handleChange} />
          </Grid>
          <Grid item xs={6}>
            <TextField type="color" label="Contrast" fullWidth name="secondaryContrast" value={(ArrayHelper.getOne(currentSettings, "keyName", "secondaryContrast"))?.value || "#000000"} onChange={handleChange} />
          </Grid>
        </Grid>
      </InputBox>
    </>
  );
}
