"use client";
import React, { useState, useCallback } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  TextField,
  MenuItem,
  Stack,
  Icon,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton
} from "@mui/material";
import { Close as CloseIcon, Delete as DeleteIcon, Save as SaveIcon } from "@mui/icons-material";
import { IconPicker } from "@/components/iconPicker/IconPicker";
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
  const [isLoading, setIsLoading] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
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

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await ApiHelper.delete("/links/" + currentTab.id, "ContentApi");
      setCurrentTab(null);
      props.updatedFunction();
    } catch (error) {
      setErrors(["Failed to delete tab. Please try again."]);
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
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

  const handleSave = async () => {
    setIsLoading(true);
    let errors: string[] = [];

    if (!currentTab.text) errors.push("Please enter valid text");
    if (currentTab?.linkType === "page" && pages.length === 0) errors.push("No page! Please create one before adding it to tab");
    if (currentTab?.linkType === "url" && !currentTab.url) errors.push("Enter a valid URL");

    if (errors.length > 0) {
      setErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      if (currentTab.linkType !== "url" && currentTab.linkType!=="page") currentTab.url = "";
      await ApiHelper.post("/links", [currentTab], "ContentApi");
      props.updatedFunction();
    } catch (error) {
      setErrors(["Failed to save tab. Please try again."]);
    } finally {
      setIsLoading(false);
    }
  }

  const getUrl = () => {
    if (currentTab?.linkType === "url") {
      return (
        <TextField
          fullWidth
          label="External URL"
          name="url"
          type="text"
          value={currentTab?.url || ""}
          onChange={handleChange}
          data-testid="tab-url-input"
          placeholder="https://example.com"
          size="small"
          sx={{ mt: 1 }}
        />
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
          options.push(
            <MenuItem value={page.id} key={page.id}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Icon sx={{ fontSize: 16 }}>article</Icon>
                <Typography>{page.title}</Typography>
              </Stack>
            </MenuItem>
          )
        });
        if (currentTab.linkData === "") currentTab.linkData = pages[0]?.url;
      }
      return (
        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
          <InputLabel id="page">Select Page</InputLabel>
          <Select
            labelId="page"
            label="Select Page"
            name="page"
            value={currentTab?.linkData || ""}
            onChange={handleChange}
            data-testid="video-tab-page-select"
          >
            {options}
          </Select>
        </FormControl>
      );
    } else return null;
  }

  React.useEffect(() => { setCurrentTab(props.currentTab); }, [props.currentTab]);

  if (!currentTab) return <></>

  return (
    <>
      <Dialog
        open={true}
        onClose={() => props.updatedFunction()}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            minHeight: '400px'
          }
        }}
      >
        <DialogTitle sx={{
          backgroundColor: "var(--c1l2)",
          color: "#FFF",
          p: 3
        }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Icon sx={{ fontSize: 24, color: '#FFF' }}>folder</Icon>
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {currentTab?.id ? 'Edit Tab' : 'Create New Tab'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Configure streaming sidebar tab settings
                </Typography>
              </Box>
            </Stack>
            <IconButton
              onClick={() => props.updatedFunction()}
              sx={{ color: '#FFF' }}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <ErrorMessages errors={errors} />

          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* Tab Display Section */}
            <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Icon sx={{ color: 'var(--c1l2)', fontSize: 18 }}>visibility</Icon>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--c1l2)' }}>
                    Tab Display
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={2} alignItems="start">
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      fullWidth
                      label="Tab Text"
                      name="text"
                      type="text"
                      value={currentTab?.text || ""}
                      onChange={handleChange}
                      placeholder="Enter tab display text"
                      size="small"
                      sx={{ mb: 2 }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
                      Icon
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={openModal}
                      data-testid="video-tab-icon-dropdown-button"
                      sx={{
                        minWidth: 60,
                        height: 40,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'grey.400',
                        color: 'var(--c1l2)',
                        '&:hover': {
                          borderColor: 'var(--c1l2)',
                          backgroundColor: 'var(--c1l7)'
                        }
                      }}
                    >
                      <Icon>{currentTab?.icon || 'link'}</Icon>
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Link Configuration Section */}
            <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Icon sx={{ color: 'var(--c1l2)', fontSize: 18 }}>settings</Icon>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--c1l2)' }}>
                    Link Configuration
                  </Typography>
                </Stack>

                <Stack spacing={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="type">Link Type</InputLabel>
                    <Select
                      labelId="type"
                      label="Link Type"
                      name="type"
                      value={currentTab?.linkType || ""}
                      onChange={handleChange}
                    >
                      <MenuItem value="url">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Icon sx={{ fontSize: 18 }}>open_in_new</Icon>
                          <Typography>External URL</Typography>
                        </Stack>
                      </MenuItem>
                      <MenuItem value="page">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Icon sx={{ fontSize: 18 }}>article</Icon>
                          <Typography>Internal Page</Typography>
                        </Stack>
                      </MenuItem>
                      <MenuItem value="chat">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Icon sx={{ fontSize: 18 }}>chat</Icon>
                          <Typography>Chat</Typography>
                        </Stack>
                      </MenuItem>
                      <MenuItem value="prayer">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Icon sx={{ fontSize: 18 }}>favorite</Icon>
                          <Typography>Prayer</Typography>
                        </Stack>
                      </MenuItem>
                    </Select>
                  </FormControl>

                  {getUrl()}
                  {getPage()}

                  {/* Link Type Helper */}
                  <Box sx={{ mt: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Icon sx={{ fontSize: 16, color: 'text.secondary' }}>info</Icon>
                      <Typography variant="caption" color="text.secondary">
                        {currentTab?.linkType === "url" && "External URL will open in a new tab"}
                        {currentTab?.linkType === "page" && "Internal page will open within the streaming interface"}
                        {currentTab?.linkType === "chat" && "Built-in chat functionality"}
                        {currentTab?.linkType === "prayer" && "Built-in prayer request feature"}
                        {!currentTab?.linkType && "Select a link type to configure the tab behavior"}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, backgroundColor: 'grey.50' }}>
          <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
            {currentTab?.id && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isLoading}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500
                }}
              >
                Delete
              </Button>
            )}
            <Box sx={{ flex: 1 }} />
            <Button
              variant="outlined"
              color="error"
              onClick={() => props.updatedFunction()}
              disabled={isLoading}
              sx={{
                textTransform: 'none',
                fontWeight: 500
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={isLoading ? null : <SaveIcon />}
              onClick={handleSave}
              disabled={isLoading}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                minWidth: 100
              }}
            >
              {isLoading ? 'Saving...' : 'Save Tab'}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      {/* Icon Picker Modal */}
      <Dialog open={isModalOpen} onClose={closeModal} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Select Icon</Typography>
            <IconButton onClick={closeModal} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <IconPicker onSelect={onSelect} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Icon sx={{ color: 'error.main' }}>warning</Icon>
            <Typography variant="h6">Delete Tab</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this tab? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={isLoading}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={isLoading}
            sx={{ textTransform: 'none' }}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
