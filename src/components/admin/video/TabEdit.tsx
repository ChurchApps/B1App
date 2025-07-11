"use client";
import React, { useState, useCallback } from "react";
import { FormControl, InputLabel, Select, SelectChangeEvent, TextField, MenuItem, Stack, Icon, Button, Dialog } from "@mui/material";
import { IconPicker } from "@/components/iconPicker/IconPicker";
import { InputBox } from "@churchapps/apphelper/dist/components/InputBox";
import { ErrorMessages } from "@churchapps/apphelper/dist/components/ErrorMessages";
import { PageInterface } from "@/helpers";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import { ArrayHelper } from "@churchapps/apphelper/dist/helpers/ArrayHelper";
import type { LinkInterface } from "@churchapps/helpers";

interface Props { currentTab: LinkInterface, updatedFunction?: () => void }

export const TabEdit: React.FC<Props> = (props) => {
  const [currentTab, setCurrentTab] = useState<LinkInterface>(null);
  const [pages, setPages] = useState<PageInterface[]>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const onSelect = useCallback((iconName: string) => {
    let t = { ...currentTab };
    t.icon = iconName;
    setCurrentTab(t);
    closeModal();
  }, [currentTab]);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you wish to delete this tab?")) {
      ApiHelper.delete("/links/" + currentTab.id, "ContentApi").then(() => { setCurrentTab(null); props.updatedFunction(); });
    }
  }

  const checkDelete = currentTab?.id ? handleDelete : undefined;
  const handleCancel = () => { props.updatedFunction(); }
  const loadPages = () => {
    ApiHelper.get("/pages", "ContentApi").then((_pages:PageInterface[]) => {
      let filteredPages:PageInterface[] = [];
      _pages.forEach(p => { if (p.url.startsWith("/stream")) filteredPages.push(p); });
      setPages(filteredPages || [])
    });
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const val = e.target.value;
    let t = { ...currentTab };
    switch (e.target.name) {
      case "text": t.text = val; break;
      case "type": t.linkType = val; break;
      case "page": t.linkData = val; t.url=ArrayHelper.getOne(pages, "id", val).url; break;
      case "url": t.url = val; break;
    }
    setCurrentTab(t);
  }

  const handleSave = () => {
    let errors: string[] = [];

    if (!currentTab.text) errors.push("Please enter valid text");
    if (currentTab?.linkType === "page" && pages.length === 0) errors.push("No page! Please create one before adding it to tab");
    if (currentTab?.linkType === "url" && !currentTab.url) errors.push("Enter a valid URL");

    if (errors.length > 0) {
      setErrors(errors);
      return;
    }

    //if (currentTab.linkType === "page") currentTab.url = currentTab.linkData + "?ts=" + new Date().getTime().toString();
    if (currentTab.linkType !== "url" && currentTab.linkType!=="page") currentTab.url = "";
    ApiHelper.post("/links", [currentTab], "ContentApi").then(props.updatedFunction);
  }

  const getUrl = () => {
    if (currentTab?.linkType === "url") {
      return (
        <TextField fullWidth label="Url" name="url" type="text" value={currentTab?.url} onChange={handleChange} data-testid="tab-url-input" />
      );
    } else return null;
  }

  const getPage = () => {
    if (currentTab?.linkType === "page") {
      let options: React.ReactElement[] = [];
      if (pages === null) loadPages();
      else {
        options = [];
        pages.forEach(page => {
          options.push(<MenuItem value={page.id} key={page.id}>{page.title}</MenuItem>)
        });
        if (currentTab.linkData === "") currentTab.linkData = pages[0]?.url;
      }
      return (
        <FormControl fullWidth>
          <InputLabel id="page">Page</InputLabel>
          <Select labelId="page" label="Page" name="page" value={currentTab?.linkData} onChange={handleChange} data-testid="video-tab-page-select">
            {options}
          </Select>
        </FormControl>
      );
    } else return null;
  }

  React.useEffect(() => { setCurrentTab(props.currentTab); }, [props.currentTab]);

  if (!currentTab) return <></>
  else return (
    <InputBox headerIcon="folder" headerText="Edit Tab" saveFunction={handleSave} cancelFunction={handleCancel} deleteFunction={checkDelete} help="b1/streaming/pages-tabs" data-testid="video-tab-edit-inputbox">
      <ErrorMessages errors={errors} />
      <Stack direction="row" pt={2}>
        <TextField fullWidth margin="none" label="Text" name="text" type="text" value={currentTab?.text} onChange={handleChange} InputProps={{
          endAdornment: <div className="input-group-append">
            <Button variant="contained" endIcon={<Icon>arrow_drop_down</Icon>} onClick={openModal} data-testid="video-tab-icon-dropdown-button">
              <Icon>{currentTab?.icon}</Icon>
            </Button>
          </div>
        }} />
        <input type="hidden" asp-for="TabId" />
      </Stack>
      <FormControl fullWidth>
        <InputLabel id="type">Type</InputLabel>
        <Select labelId="type" label="Type" name="type" value={currentTab?.linkType || ""} onChange={handleChange}>
          <MenuItem value="url">External Url</MenuItem>
          <MenuItem value="page">Page</MenuItem>
          <MenuItem value="chat">Chat</MenuItem>
          <MenuItem value="prayer">Prayer</MenuItem>
        </Select>
      </FormControl>
      {getUrl()}
      {
        getPage()
      }

      <Dialog open={isModalOpen}>
        <IconPicker onSelect={onSelect} />
      </Dialog>
    </InputBox>
  );
}
