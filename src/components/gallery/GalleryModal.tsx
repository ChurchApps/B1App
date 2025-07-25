"use client";

import { FileHelper, CommonEnvironmentHelper } from "@churchapps/helpers";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import { Locale } from "@churchapps/apphelper/dist/helpers/Locale";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Grid, IconButton, InputLabel, MenuItem, Select, Tab, Tabs, Tooltip, Icon } from "@mui/material";
import React, { useState } from "react";
import { ImageEditor } from "@churchapps/apphelper/dist/components/ImageEditor";
import { TabPanel } from "@churchapps/apphelper/dist/components/TabPanel";
import { StockPhotos } from "./StockPhotos";
import { EnvironmentHelper } from "@/helpers";

interface Props {
  aspectRatio: number,
  onClose: () => void,
  onSelect: (img: string) => void
}

export const GalleryModal: React.FC<Props> = (props: Props) => {
  const [images, setImages] = useState<string[]>([]);
  const [tabIndex, setTabIndex] = React.useState(0);
  const [aspectRatio, setAspectRatio] = React.useState(Math.round(props.aspectRatio * 100) / 100);
  const [editorPhotoUrl, setEditorPhotoUrl] = React.useState("");

  const handleTabChange = (el: any, newValue: any) => { setTabIndex(newValue); }

  const loadData = () => { ApiHelper.get("/gallery/" + aspectRatio.toString(), "ContentApi").then(data => setImages(data.images)); }

  const handleImageUpdated = async (dataUrl: string) => {
    const fileName = Math.floor(Date.now() / 1000).toString() + ".jpg"
    const blob = FileHelper.dataURLtoBlob(dataUrl);
    const file = new File([blob], "file_name");

    const params = { folder: aspectRatio.toString(), fileName };
    const presigned = await ApiHelper.post("/gallery/requestUpload", params, "ContentApi");
    const doUpload = presigned.key !== undefined;
    if (doUpload) await FileHelper.postPresignedFile(presigned, file, () => { });
    //return doUpload;
    setTabIndex(0);
    loadData();
  };

  const handleDelete = (folder: string, image: string) => {
    if (window.confirm(Locale.label("gallery.confirmDelete"))) {
      ApiHelper.delete("/gallery/" + folder + "/" + image, "ContentApi").then(() => { loadData(); });
    }
  }

  React.useEffect(() => { if (aspectRatio !== props.aspectRatio) setAspectRatio(Math.round(props.aspectRatio * 100) / 100) }, [props.aspectRatio]); //eslint-disable-line
  React.useEffect(loadData, [aspectRatio]); //eslint-disable-line

  const getImages = () => {
    console.log("GET IMAGES", EnvironmentHelper.Common.ContentRoot);
    let result: React.ReactElement[] = [];
    images.forEach(img => {
      const parts = img.split("/");

      result.push(<Grid size={{ xs: 12, md: 4 }}>
        <Box sx={{ position: "relative", ":hover #deleteIcon": { visibility: "visible" } }}>
          <a href="about:blank" onClick={(e) => { e.preventDefault(); props.onSelect(EnvironmentHelper.Common.ContentRoot + "/" + img) }} aria-label="Select image" data-testid="select-image">
            <Box component="img" src={EnvironmentHelper.Common.ContentRoot + "/" + img} className="img-fluid" alt="custom" />
          </a>
          <Box id="deleteIcon" sx={{ position: "absolute", top: 3, right: 3, visibility: "hidden", backgroundColor: "whitesmoke", borderRadius: 5 }}>
            <Tooltip title="Delete">
              <IconButton size="small" color="error" onClick={() => handleDelete(parts[2], parts[3])} aria-label="Delete image" data-testid="delete-image">
                <Icon sx={{ fontSize: "17px !important" }}>delete_outline</Icon>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Grid>);
    })
    return result;
  }

  const handleStockSelect = (url: string) => {
    setEditorPhotoUrl(url);
    setTabIndex(1);
  }

  const getDisplayAspect = () => {
    let result = aspectRatio.toString();
    if (aspectRatio === 0) result = "Free Form";
    else if (aspectRatio === 1) result = "1:1";
    else if (aspectRatio === 2) result = "2:1";
    else if (aspectRatio === 3) result = "3:1";
    else if (aspectRatio === 4) result = "4:1";
    else if (aspectRatio === 1.33) result = "4:3";
    else if (aspectRatio === 1.78) result = "16:9";
    else if (aspectRatio === 0.5) result = "1:2";
    else if (aspectRatio === 0.5625) result = "9:16";
    return result;
  }

  return (<>
    <Dialog open={true} onClose={props.onClose}>
      <DialogTitle>Select a Photo</DialogTitle>
      <DialogContent style={{ overflowX: "hidden" }}>

        {(props.aspectRatio === 0) && (
          <FormControl fullWidth>
            <InputLabel>{Locale.label("gallery.aspectRatio")}</InputLabel>
            <Select size="small" label={Locale.label("gallery.aspectRatio")} name="aspectRatio" value={aspectRatio} onChange={(e) => setAspectRatio(parseFloat(e.target.value.toString()))}>
              <MenuItem value="0">{Locale.label("gallery.freeForm")}</MenuItem>
              <MenuItem value="1">1:1</MenuItem>
              <MenuItem value="2">2:1</MenuItem>
              <MenuItem value="3">3:1</MenuItem>
              <MenuItem value="4">4:1</MenuItem>
              <MenuItem value="1.33">4:3</MenuItem>
              <MenuItem value="1.78">16:9</MenuItem>
              <MenuItem value="0.5">1:2</MenuItem>
              <MenuItem value="0.5625">9:16</MenuItem>
            </Select>
          </FormControl>
        )}

        <Tabs variant="fullWidth" value={tabIndex} onChange={handleTabChange}>
          <Tab label="Gallery" />
          <Tab label="Upload" />
          <Tab label="Stock Photos" />
        </Tabs>
        <TabPanel value={tabIndex} index={0}>

          <Grid container spacing={3} alignItems="center">
            {getImages()}
          </Grid>
        </TabPanel>
        <TabPanel value={tabIndex} index={1}>
          <div>{Locale.label("gallery.aspectRatio")}: {getDisplayAspect()}</div>
          <ImageEditor onUpdate={handleImageUpdated} photoUrl={editorPhotoUrl} aspectRatio={aspectRatio} outputWidth={1280} outputHeight={768} hideDelete={true} />
        </TabPanel>
        <TabPanel value={tabIndex} index={2}>
          <StockPhotos aspectRatio={aspectRatio} onSelect={props.onSelect} onStockSelect={handleStockSelect} />
        </TabPanel>
      </DialogContent>
      <DialogActions sx={{ paddingX: "16px", paddingBottom: "12px" }}>
        <Button variant="outlined" onClick={props.onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  </>);
};
