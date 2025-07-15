"use client";
import React, { useState, useEffect, useCallback } from "react";
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
  Box,
  Card,
  CardContent,
  Divider,
  IconButton,
  Grid
} from "@mui/material";
import { 
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Image as ImageIcon
} from "@mui/icons-material";
import { B1LinkInterface, PageInterface } from "@/helpers";
import { IconPicker } from "@/components/iconPicker/IconPicker";
import { GalleryModal } from "../../gallery/GalleryModal";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import { UniqueIdHelper } from "@churchapps/apphelper/dist/helpers/UniqueIdHelper";
import { ArrayHelper } from "@churchapps/apphelper/dist/helpers/ArrayHelper";
import { CardWithHeader, LoadingButton } from "@/components/ui";

interface Props {
  currentTab: B1LinkInterface;
  updatedFunction?: () => void;
}

export function TabEdit({ currentTab: currentTabFromProps, updatedFunction = () => { } }: Props) {
  const [currentTab, setCurrentTab] = useState<B1LinkInterface>(null);
  const [pages, setPages] = useState<PageInterface[]>(null);
  const [showLibrary, setShowLibrary] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    setCurrentTab(currentTabFromProps);
  }, [currentTabFromProps]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (currentTab.linkType !== "url" && currentTab.linkType !== "page") currentTab.url = "";
      await ApiHelper.post("/links", [currentTab], "ContentApi");
      updatedFunction();
    } catch (error) {
      console.error("Error saving tab:", error);
    } finally {
      setIsSaving(false);
    }
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
  };

  const onSelect = useCallback((iconName: string) => {
    let t = { ...currentTab };
    t.icon = iconName;
    setCurrentTab(t);
    setIsModalOpen(false);
  }, [currentTab]);

  const handlePhotoSelected = (image: string) => {
    const updatedTab = { ...currentTab };
    updatedTab.photo = image;

    setCurrentTab(updatedTab);
    setShowLibrary(false);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you wish to delete this tab?")) {
      ApiHelper.delete("/links/" + currentTab.id, "ContentApi").then(() => {
        setCurrentTab(null);
        updatedFunction();
      });
    }
  };

  const loadPages = () => {
    ApiHelper.get("/pages", "ContentApi").then((_pages:PageInterface[]) => {
      let filteredPages:PageInterface[] = [];
      _pages.forEach(p => { if (p.url.startsWith("/member")) filteredPages.push(p); });
      setPages(filteredPages || [])
    });
  };

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
          <Select labelId="page" label="Page" name="page" value={currentTab?.linkData} onChange={handleChange} data-testid="page-select">
            {options}
          </Select>
        </FormControl>
      );
    } else return null;
  }

  const isDisabled = (tabName: string) => false;

  if (!currentTab) {
    return null;
  }

  /*
    <MenuItem value="checkin" disabled={isDisabled("checkin")}>Checkin</MenuItem>
    <MenuItem value="donation" disabled={isDisabled("donation")}>Donation</MenuItem>
    <MenuItem value="donationLanding" disabled={isDisabled("donationLanding")}>Donation Landing</MenuItem>
    <MenuItem value="directory" disabled={isDisabled("directory")}>Member Directory</MenuItem>
    <MenuItem value="groups" disabled={isDisabled("groups")}>My Groups</MenuItem>
    <MenuItem value="lessons" disabled={isDisabled("lessons")}>Lessons.church</MenuItem>
  */

  return (
    <>
      <CardWithHeader
        title={UniqueIdHelper.isMissing(currentTab?.id) ? "Add New Tab" : "Edit Tab"}
        icon={<EditIcon />}
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={updatedFunction}
              size="small"
              sx={{ textTransform: 'none' }}
            >
              Cancel
            </Button>
            <LoadingButton
              loading={isSaving}
              loadingText="Saving..."
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              size="small"
              sx={{ textTransform: 'none' }}
            >
              Save Tab
            </LoadingButton>
          </Stack>
        }
      >
        <Grid container spacing={3}>
          {/* Tab Preview */}
          <Grid item xs={12} md={6}>
            <Card sx={{ border: '1px solid', borderColor: 'grey.200' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Tab Preview
                </Typography>
                <TabPreview tab={currentTab} />
                <Button
                  variant="outlined"
                  startIcon={<ImageIcon />}
                  onClick={() => setShowLibrary(true)}
                  size="small"
                  sx={{ mt: 2, textTransform: 'none' }}
                  data-testid="change-image-button"
                >
                  Change Background Image
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Tab Settings */}
          <Grid item xs={12} md={6}>
            <Card sx={{ border: '1px solid', borderColor: 'grey.200' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Tab Settings
                </Typography>
                
                <Stack spacing={3}>
                  {/* Tab Name and Icon */}
                  <TextField
                    fullWidth
                    label="Tab Name"
                    name="text"
                    value={currentTab?.text || ""}
                    onChange={handleChange}
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          onClick={() => setIsModalOpen(true)}
                          data-testid="icon-dropdown-button"
                          sx={{ color: 'primary.main' }}
                        >
                          <Icon>{currentTab?.icon}</Icon>
                        </IconButton>
                      )
                    }}
                    helperText="Choose a descriptive name for your tab"
                  />

                  {/* Tab Type */}
                  <FormControl fullWidth>
                    <InputLabel id="type">Tab Type</InputLabel>
                    <Select
                      labelId="type"
                      label="Tab Type"
                      name="type"
                      value={currentTab?.linkType || ""}
                      onChange={handleChange}
                    >
                      <MenuItem value="bible" disabled={isDisabled("bible")}>Bible</MenuItem>
                      <MenuItem value="stream" disabled={isDisabled("stream")}>Live Stream</MenuItem>
                      <MenuItem value="votd" disabled={isDisabled("votd")}>Verse of the Day</MenuItem>
                      <MenuItem value="url">External URL</MenuItem>
                      <MenuItem value="page">Internal Page</MenuItem>
                    </Select>
                  </FormControl>

                  {/* URL Field */}
                  {currentTab?.linkType === "url" && (
                    <TextField
                      fullWidth
                      label="URL"
                      name="url"
                      type="url"
                      value={currentTab?.url || ""}
                      onChange={handleChange}
                      helperText="Enter the full URL (e.g., https://example.com)"
                    />
                  )}

                  {/* Page Selection */}
                  {getPage()}
                </Stack>

                {/* Delete Action */}
                {!UniqueIdHelper.isMissing(currentTab?.id) && (
                  <>
                    <Divider sx={{ mt: 4, mb: 2 }} />
                    <Box sx={{ textAlign: 'center' }}>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleDelete}
                        size="small"
                        sx={{ textTransform: 'none' }}
                      >
                        Delete Tab
                      </Button>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </CardWithHeader>

      {/* Modals */}
      <Dialog open={isModalOpen} maxWidth="md" fullWidth>
        <IconPicker onSelect={onSelect} />
      </Dialog>
      
      {showLibrary && (
        <GalleryModal
          onClose={() => setShowLibrary(false)}
          onSelect={handlePhotoSelected}
          aspectRatio={4}
        />
      )}
    </>
  );
}

interface TabPreviewProps {
  tab: B1LinkInterface;
}

function TabPreview({ tab }: TabPreviewProps) {
  const imageUrl = tab?.photo || "/images/dashboard/storm.png";

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: '4/1',
        borderRadius: 2,
        overflow: 'hidden',
        backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid',
        borderColor: 'grey.300'
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'white', textAlign: 'center' }}>
        {tab?.icon && (
          <Icon sx={{ fontSize: 24, color: 'white' }}>
            {tab.icon}
          </Icon>
        )}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: 'white',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}
          noWrap
        >
          {tab?.text || "Tab Name"}
        </Typography>
      </Stack>
    </Box>
  );
}
