import React, { useState } from "react";
import {
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Box,
  Card,
  CardContent,
  Button,
  Icon,
  IconButton
} from "@mui/material";
import { Close as CloseIcon, Save as SaveIcon, Delete as DeleteIcon, Link as LinkIcon } from "@mui/icons-material";
import { ApiHelper } from "@churchapps/apphelper";
import { ErrorMessages } from "@churchapps/apphelper";
import { UserHelper } from "@churchapps/apphelper";
import { Permissions } from "@churchapps/helpers";
import type { LinkInterface } from "@churchapps/helpers";

interface Props {
  currentLink: LinkInterface,
  updatedFunction?: () => void,
  links: LinkInterface[],
}

export const LinkEdit: React.FC<Props> = (props) => {
  const [currentLink, setCurrentLink] = useState<LinkInterface>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [links, setLinks] = useState<LinkInterface[]>(null);
  const [subName, setSubName] = useState<string>(null);
  const [toggleSubName, setToggleSubName] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

  const filteredGroupLinks = links && links.filter((link) => link.id !== currentLink.id);

  const handleDelete = async () => {
    setIsLoading(true);
    let errors: string[] = [];
    let i = 0;
    links.forEach(link => {
      if (currentLink.id === link.parentId) {i++;}
    });

    if (!UserHelper.checkAccess(Permissions.contentApi.content.edit)) errors.push("Unauthorized to delete links");
    if (i > 0) errors.push("Delete nested links first");

    if (errors.length > 0) {
      setErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      await ApiHelper.delete("/links/" + currentLink.id, "ContentApi");
      setCurrentLink(null);
      props.updatedFunction();
    } catch (error) {
      setErrors(["Failed to delete link. Please try again."]);
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
    }
  }
  const checkDelete = currentLink?.id ? handleDelete : undefined;
  const handleCancel = () => { props.updatedFunction(); }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.currentTarget.value;
    let l = { ...currentLink };
    switch (e.currentTarget.name) {
      case "text": l.text = val; break;
      case "url": l.url = val; break;
    }
    setCurrentLink(l);
  }

  const toggleChange = (e: React.MouseEvent<HTMLElement>, val: string | null) => {
    setSubName(e?.currentTarget?.innerText);
    let l = {...currentLink};
    l.parentId = val;
    setCurrentLink(l);
  }

  const handleSave = async () => {
    setIsLoading(true);
    let errors: string[] = [];
    if (!currentLink.text.trim()) errors.push("Please enter valid text");
    if (!currentLink.url.trim()) errors.push("Please enter link");
    if (!UserHelper.checkAccess(Permissions.contentApi.content.edit)) errors.push("Unauthorized to create links");

    if (errors.length > 0) {
      setErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      await ApiHelper.post("/links", [currentLink], "ContentApi");
      props.updatedFunction();
    } catch (error) {
      setErrors(["Failed to save link. Please try again."]);
    } finally {
      setIsLoading(false);
    }
  }

  React.useEffect(() => { setCurrentLink(props.currentLink); }, [props.currentLink]);
  React.useEffect(() => { setLinks(props.links); }, [props.links]);

  if (!currentLink) return <></>;

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
                <LinkIcon sx={{ fontSize: 24, color: '#FFF' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {currentLink?.id ? 'Edit Navigation Link' : 'Create New Link'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Configure navigation link settings
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
            {/* Link Details Section */}
            <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Icon sx={{ color: 'var(--c1l2)', fontSize: 18 }}>edit</Icon>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--c1l2)' }}>
                    Link Details
                  </Typography>
                </Stack>

                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Display Text"
                    name="text"
                    type="text"
                    value={currentLink?.text || ""}
                    onChange={handleChange}
                    data-testid="link-text-input"
                    aria-label="Link display text"
                    placeholder="Enter text to display in navigation"
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="Link URL"
                    name="url"
                    type="text"
                    value={currentLink?.url || ""}
                    onChange={handleChange}
                    data-testid="link-url-input"
                    aria-label="Link URL"
                    placeholder="https://example.com or /internal-page"
                    size="small"
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Submenu Configuration Section */}
            {filteredGroupLinks?.length > 0 && (
              <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <Icon sx={{ color: 'var(--c1l2)', fontSize: 18 }}>account_tree</Icon>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--c1l2)' }}>
                      Menu Organization
                    </Typography>
                  </Stack>

                  <Stack spacing={2}>
                    <Box>
                      {subName && toggleSubName === true
                        ? (
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                            <Icon sx={{ fontSize: 16, color: 'success.main' }}>check_circle</Icon>
                            <Typography variant="body2" color="success.main">
                            This link will be placed under submenu: <strong>{subName}</strong>
                            </Typography>
                          </Stack>
                        )
                        : (
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                            <Icon sx={{ fontSize: 16, color: 'text.secondary' }}>info</Icon>
                            <Typography variant="body2" color="text.secondary">
                            Optionally organize this link under an existing submenu:
                            </Typography>
                          </Stack>
                        )}
                    </Box>

                    <Box>
                      <ToggleButtonGroup
                        exclusive
                        value={currentLink?.parentId}
                        onChange={toggleChange}
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 1
                        }}
                      >
                        {filteredGroupLinks.map((link: LinkInterface) => (
                          <ToggleButton
                            key={link.id}
                            value={link.id}
                            size="small"
                            color="primary"
                            onClick={() => setToggleSubName(!toggleSubName)}
                            data-testid={`submenu-toggle-${link.id}`}
                            aria-label={`Set as submenu under ${link.text}`}
                            sx={{
                              borderRadius: 1,
                              textTransform: 'none',
                              fontWeight: 500,
                              '&.Mui-selected': {
                                backgroundColor: 'var(--c1l2)',
                                color: '#FFF',
                                '&:hover': {
                                  backgroundColor: 'var(--c1l1)'
                                }
                              }
                            }}
                          >
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Icon sx={{ fontSize: 16 }}>folder</Icon>
                              <Typography variant="body2">{link.text}</Typography>
                            </Stack>
                          </ToggleButton>
                        ))}
                      </ToggleButtonGroup>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, backgroundColor: 'grey.50' }}>
          <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
            {currentLink?.id && (
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
              {isLoading ? 'Saving...' : 'Save Link'}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Icon sx={{ color: 'error.main' }}>warning</Icon>
            <Typography variant="h6">Delete Link</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this navigation link? This action cannot be undone.
          </Typography>
          {links?.some(link => link.parentId === currentLink.id) && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: 'warning.light', borderRadius: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Icon sx={{ color: 'warning.main' }}>info</Icon>
                <Typography variant="body2" color="warning.dark">
                  This link has nested sublinks. Please delete those first.
                </Typography>
              </Stack>
            </Box>
          )}
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
