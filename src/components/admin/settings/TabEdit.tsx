import { useState, useEffect, useCallback } from "react";
import {
  Typography,
  Button,
  Stack,
  TextField,
  FormControl,
  Icon,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  SelectChangeEvent,
} from "@mui/material";
import { B1LinkInterface, EnvironmentHelper, UserHelper, ApiHelper, UniqueIdHelper, ConfigHelper, B1PageInterface } from "@/helpers";
import SearchIcons from "@/appBase/components/material/iconpicker/IconPicker";
import { GalleryModal } from "@/appBase/components/gallery/GalleryModal";
import { InputBox } from "@/components";

interface Props {
  currentTab: B1LinkInterface;
  updatedFunction?: () => void;
}

export function TabEdit({ currentTab: currentTabFromProps, updatedFunction = () => { } }: Props) {
  const [currentTab, setCurrentTab] = useState<B1LinkInterface>(null);
  const [pages, setPages] = useState<B1PageInterface[]>(null);
  const [showLibrary, setShowLibrary] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    setCurrentTab(currentTabFromProps);
  }, [currentTabFromProps]);

  const handleSave = () => {
    if (currentTab.linkType !== "url") currentTab.url = "";
    if (currentTab.linkType === "page") {
      const rnd = Math.floor(Math.random() * 999999);
      currentTab.url =
        EnvironmentHelper.Common.ContentRoot +
        "/" +
        UserHelper.currentUserChurch.church.id +
        "/pages/" +
        currentTab.linkData +
        ".html?rnd=" +
        rnd.toString();
    }
    ApiHelper.post("/links", [currentTab], "B1Api").then(updatedFunction);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    const val = e.target.value;

    let t = { ...currentTab };
    switch (e.target.name) {
      case "text":
        t.text = val;
        break;
      case "type":
        t.linkType = val;
        break;
      case "page":
        t.linkData = val;
        break;
      case "url":
        t.url = val;
        break;
    }
    setCurrentTab(t);
  };

  const onSelect = useCallback(
    (iconName: string) => {
      let t = { ...currentTab };
      t.icon = iconName;
      setCurrentTab(t);
      setIsModalOpen(false);
    },
    [currentTab]
  );

  const handlePhotoSelected = (image: string) => {
    const updatedTab = { ...currentTab };
    updatedTab.photo = image;

    setCurrentTab(updatedTab);
    setShowLibrary(false);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you wish to delete this tab?")) {
      ApiHelper.delete("/links/" + currentTab.id, "B1Api").then(() => {
        setCurrentTab(null);
        updatedFunction();
      });
    }
  };

  const loadPages = () => {
    ApiHelper.get("/pages/", "B1Api").then((data: B1PageInterface[]) => {
      setPages(data)

      if (!currentTab?.linkData) {
        const linkData = data[data.length - 1]?.id || ""
        setCurrentTab({ ...currentTab, linkData: linkData })
      }
    })
  }

  const getPage = () => {
    if (currentTab?.linkType === "page") {
      let options: JSX.Element[] = [];
      if (pages === null) loadPages();
      else {
        options = [];
        pages.forEach((page) =>
          options.push(
            <MenuItem value={page.id} key={page.id}>
              {page.name}
            </MenuItem>
          )
        );
      }
      return (
        <FormControl fullWidth>
          <InputLabel id="page">Page</InputLabel>
          <Select labelId="page" label="Page" name="page" value={currentTab?.linkData || ""} onChange={handleChange}>
            {options}
          </Select>
        </FormControl>
      );
    } else return null;
  };

  const isDisabled = (tabName: string) => {
    /*
    if (ConfigHelper.current.tabs.some((t) => t.linkType === tabName)) {
      return true;
    }*/
    return false;
  };

  if (!currentTab) {
    return null;
  }

  return (
    <>
      <InputBox
        headerIcon="folder"
        headerText="Edit Tab"
        saveFunction={handleSave}
        cancelFunction={updatedFunction}
        deleteFunction={!UniqueIdHelper.isMissing(currentTab?.id) ? handleDelete : null}
      >
        <Typography sx={{ marginTop: 2, marginBottom: 1 }}>Tab Preview:</Typography>
        <div>
          <TabPreview tab={currentTab} />
          <Button
            onClick={() => {
              setShowLibrary(true);
            }}
          >
            Change Image
          </Button>
        </div>
        <Stack direction="row" pt={2}>
          <TextField
            fullWidth
            margin="none"
            label="Text"
            name="text"
            type="text"
            value={currentTab?.text || ""}
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <div className="input-group-append">
                  <Button
                    variant="contained"
                    endIcon={<Icon>arrow_drop_down</Icon>}
                    onClick={() => setIsModalOpen(true)}
                  >
                    <Icon>{currentTab?.icon}</Icon>
                  </Button>
                </div>
              ),
            }}
          />
          <input type="hidden" asp-for="TabId" />
        </Stack>
        <FormControl fullWidth>
          <InputLabel id="type">Type</InputLabel>
          <Select
            labelId="type"
            label="Type"
            id="tabType"
            name="type"
            value={currentTab?.linkType || ""}
            onChange={handleChange}
          >
            <MenuItem value="bible" disabled={isDisabled("bible")}>
              Bible
            </MenuItem>
            <MenuItem value="checkin" disabled={isDisabled("checkin")}>
              Checkin
            </MenuItem>
            <MenuItem value="donation" disabled={isDisabled("donation")}>
              Donation
            </MenuItem>
            <MenuItem value="donationLanding" disabled={isDisabled("donationLanding")}>
              Donation Landing
            </MenuItem>
            <MenuItem value="directory" disabled={isDisabled("directory")}>
              Member Directory
            </MenuItem>
            <MenuItem value="stream" disabled={isDisabled("stream")}>
              Live Stream
            </MenuItem>
            <MenuItem value="lessons" disabled={isDisabled("lessons")}>
              Lessons.church
            </MenuItem>
            <MenuItem value="votd" disabled={isDisabled("votd")}>
              Verse of the Day
            </MenuItem>
            <MenuItem value="groups" disabled={isDisabled("groups")}>
              My Groups
            </MenuItem>
            <MenuItem value="url">External Url</MenuItem>
            <MenuItem value="page">Page</MenuItem>
          </Select>
        </FormControl>
        {currentTab?.linkType === "url" ? (
          <TextField
            fullWidth
            label="Url"
            name="url"
            type="text"
            value={currentTab?.url || ""}
            onChange={handleChange}
          />
        ) : null}
        {getPage()}

        <Dialog open={isModalOpen}>
          <SearchIcons onSelect={onSelect} />
        </Dialog>
      </InputBox>
      {showLibrary && (
        <GalleryModal onClose={() => setShowLibrary(false)} onSelect={handlePhotoSelected} aspectRatio={4} />
      )}
    </>
  );
}

interface TabPreviewProps {
  tab: B1LinkInterface;
}

function TabPreview({ tab }: TabPreviewProps) {
  const el = document.getElementById("tabType");
  let width = el?.offsetWidth || 400;
  if (width > 400) width = 400;
  const height = width / 4;
  const imageUrl = tab?.photo || "/images/dashboard/storm.png";

  return (
    <div style={{ backgroundColor: "#000000", width: width, height: height, marginBottom: 10 }}>
      <div
        style={{
          textAlign: "center",
          position: "absolute",
          zIndex: 9999,
          width: width,
          height: height,
          paddingTop: (height - 38) / 2,
        }}
      >
        <Typography sx={{ fontSize: 34, color: "#FFFFFF" }} style={{ color: "#FFF" }}>
          {tab?.text}
        </Typography>
      </div>
      <img id="tabImage" src={imageUrl} alt="tab" style={{ cursor: "pointer", opacity: 0.7 }} />
    </div>
  );
}
