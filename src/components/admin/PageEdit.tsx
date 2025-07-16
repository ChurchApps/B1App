"use client";
import { useState, useEffect } from "react";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import { UserHelper } from "@churchapps/apphelper/dist/helpers/UserHelper";
import { Permissions } from "@churchapps/helpers";
import { SlugHelper } from "@churchapps/apphelper/dist/helpers/SlugHelper";
import { TemplateHelper } from "@/helpers/TemplateHelper";
import { PageInterface } from "@/helpers";
import {
  Button,
  FormControl,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
  Card,
  CardContent,
  Box,
  Alert,
  Chip,
  Divider,
  IconButton,
  Tooltip
} from "@mui/material";
import {
  Article as ArticleIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  CheckCircle as CheckCircleIcon,
  Launch as LaunchIcon,
  Info as InfoIcon
} from '@mui/icons-material';

type Props = {
  page: PageInterface;
  embedded?: boolean;
  updatedCallback: (page: PageInterface) => void;
};

export function PageEdit(props: Props) {
  const [page, setPage] = useState<PageInterface>(null);
  const [errors, setErrors] = useState([]);
  const [checked, setChecked] = useState<boolean>();
  const [pageTemplate, setPageTemplate] = useState<string>("blank");
  const [showPageTemplate, setShowPageTemplate] = useState<boolean>(true);

  const handleCancel = () => props.updatedCallback(page);
  const handleKeyDown = (e: React.KeyboardEvent<any>) => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    e.preventDefault();
    let p = { ...page };
    const val = e.target.value;
    switch (e.target.name) {
      case "title": p.title = val; break;
      case "url": p.url = val.toLowerCase(); break;
      case "layout": p.layout = val; break;
    }
    setPage(p);
  };

  const validate = () => {
    let errors = [];
    if (!page.url || page.url === "") errors.push("Please enter a path.");
    if (!page.title || page.title === "") errors.push("Please enter a title.");
    if (!UserHelper.checkAccess(Permissions.contentApi.content.edit)) errors.push("Unauthorized to create pages");
    if (!checked) errors.push("Please check Url Path");
    setErrors(errors);
    return errors.length === 0;
  };

  const createTemplate = async(type: string, pageId: string) => {
    switch (type) {
      case "blank": ; break;
      case "sermons": await TemplateHelper.createSermonsPage(pageId); break;
      case "about": await TemplateHelper.createAboutUsPage(pageId); break;
      case "donate": await TemplateHelper.createDonatePage(pageId); break;
      case "location": await TemplateHelper.createVisitPage(pageId); break;
    }
  }

  const handleSave = () => {
    if (validate()) {
      ApiHelper.post("/pages", [page], "ContentApi").then((data) => {
        setPage(data);
        createTemplate(pageTemplate, data[0].id);
        props.updatedCallback(data);
      });
    }
  };

  const handleDelete = () => {
    let errors = [];
    if (!UserHelper.checkAccess(Permissions.contentApi.content.edit)) errors.push("Unauthorized to delete pages");

    if (errors.length > 0) {
      setErrors(errors);
      return ;
    }

    if (window.confirm("Are you sure you wish to permanently delete this page?")) {
      ApiHelper.delete("/pages/" + page.id.toString(), "ContentApi").then(() => props.updatedCallback(null));
    }
  };

  const handleSlugValidation = () => {
    const p = { ...page };
    p.url = SlugHelper.slugifyString(p.url, "urlPath");
    setPage(p);
    setChecked(true);
  }

  const handleDuplicate = (e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm("Are you sure you wish to make a copy of this page and all of it's contents?")) {
      ApiHelper.post("/pages/duplicate/" + page.id, {}, "ContentApi").then((data) => {
        setPage(null);
        props.updatedCallback(data);
      });
    }
  }


  useEffect(() => {
    setPage(props.page);
    if (props.page.url) { setChecked(true); };
    if (Object.keys(props.page).length > 0) { setShowPageTemplate(false) };
  }, [props.page]);

  if (!page) return <></>

  return (
    <Card sx={{
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'grey.200',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <Box sx={{
        p: 3,
        borderBottom: 1,
        borderColor: "divider",
        background: 'linear-gradient(135deg, var(--c1l2) 0%, var(--c1l1) 100%)',
        color: '#FFF'
      }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '12px',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ArticleIcon sx={{ fontSize: 24, color: '#FFF' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                {page.id ? 'Edit Page' : 'Create New Page'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                {page.id ? 'Update page details and settings' : 'Set up a new page for your site'}
              </Typography>
            </Box>
          </Stack>
          {page.id && (
            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
              label="Published"
              size="small"
              sx={{
                backgroundColor: "rgba(255,255,255,0.2)",
                color: "#FFF",
                fontSize: '0.75rem',
                height: 24
              }}
            />
          )}
        </Stack>
      </Box>

      {/* Content */}
      <CardContent sx={{ p: 4 }}>
        <Stack spacing={4}>
          {/* Error Messages */}
          {errors.length > 0 && (
            <Alert
              severity="error"
              data-testid="page-errors"
              sx={{
                borderRadius: 2,
                '& .MuiAlert-message': { width: '100%' }
              }}
            >
              <Stack spacing={1}>
                {errors.map((error, index) => (
                  <Typography key={index} variant="body2">
                    {error}
                  </Typography>
                ))}
              </Stack>
            </Alert>
          )}

          {/* Page Information Section */}
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
              <InfoIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                Page Information
              </Typography>
            </Stack>

            <Stack spacing={3}>
              {/* Title Field */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                  Page Title *
                </Typography>
                <TextField
                  fullWidth
                  name="title"
                  placeholder="Enter a descriptive title for your page"
                  value={page.title || ''}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  data-testid="page-title-input"
                  aria-label="Page title"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'grey.50',
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'grey.400'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                        borderWidth: '2px'
                      }
                    }
                  }}
                />
              </Box>

              {/* URL Field */}
              {checked
                ? (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                    URL Path
                    </Typography>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        backgroundColor: 'grey.50',
                        border: '1px solid',
                        borderColor: 'grey.200',
                        borderRadius: 2,
                        position: 'relative'
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
                          <CheckCircleIcon sx={{ color: 'success.main', fontSize: 22 }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                              {page.url}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            URL path validated and ready to use
                            </Typography>
                          </Box>
                        </Stack>
                        <Tooltip title="Preview page" arrow>
                          <IconButton
                            size="small"
                            onClick={() => window.open(`https://${UserHelper.currentUserChurch.church.subDomain}.b1.church${page.url}`, '_blank')}
                            sx={{
                              color: 'primary.main',
                              '&:hover': { backgroundColor: 'primary.light' }
                            }}
                          >
                            <LaunchIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Paper>
                    <Box sx={{ mt: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">
                      Live URL:
                        <Typography component="span" sx={{ fontWeight: 500, ml: 0.5 }}>
                          {`https://${UserHelper.currentUserChurch.church.subDomain}.b1.church${page.url}`}
                        </Typography>
                      </Typography>
                    </Box>
                  </Box>
                )
                : (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                    URL Path *
                    </Typography>
                    <TextField
                      fullWidth
                      name="url"
                      placeholder="/your-page-path"
                      value={page.url || ''}
                      onChange={handleChange}
                      helperText="Enter a URL path (e.g., /about-us, /events). Click 'Validate' to check availability."
                      InputProps={{
                        startAdornment: (
                          <Typography variant="body2" sx={{ color: 'text.secondary', mr: 1 }}>
                          /
                          </Typography>
                        ),
                        endAdornment: (
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={handleSlugValidation}
                            data-testid="check-url-button"
                            aria-label="Validate URL path"
                            sx={{
                              ml: 1,
                              textTransform: 'none',
                              fontWeight: 600,
                              borderRadius: 1.5
                            }}
                          >
                          Validate
                          </Button>
                        )
                      }}
                      data-testid="page-url-input"
                      aria-label="Page URL path"
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'grey.50',
                          borderRadius: 2,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'grey.400'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                            borderWidth: '2px'
                          }
                        }
                      }}
                    />
                  </Box>
                )}
            </Stack>
          </Box>

          {/* Configuration Section */}
          {!props.embedded && (
            <Box>
              <Divider sx={{ mb: 3 }}>
                <Chip
                  label="Configuration"
                  color="primary"
                  variant="outlined"
                  sx={{
                    fontWeight: 600,
                    backgroundColor: 'background.paper'
                  }}
                />
              </Divider>

              <Stack spacing={3}>
                {/* Layout Field */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                    Page Layout
                  </Typography>
                  <FormControl fullWidth variant="outlined">
                    <Select
                      fullWidth
                      value={page.layout || ""}
                      name="layout"
                      onChange={handleChange}
                      data-testid="page-layout-select"
                      aria-label="Select page layout"
                      displayEmpty
                      sx={{
                        backgroundColor: 'grey.50',
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'grey.400'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                          borderWidth: '2px'
                        }
                      }}
                    >
                      <MenuItem value="" disabled>
                        <em>Choose a layout</em>
                      </MenuItem>
                      <MenuItem value="headerFooter">Header & Footer</MenuItem>
                      <MenuItem value="cleanCentered">Clean Centered Content</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Page Template Field (only for new pages) */}
                {showPageTemplate === true && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                      Page Template
                    </Typography>
                    <FormControl fullWidth variant="outlined">
                      <Select
                        fullWidth
                        name="pageTemplate"
                        value={pageTemplate}
                        onChange={(e) => setPageTemplate(e.target.value)}
                        data-testid="page-template-select"
                        aria-label="Select page template"
                        sx={{
                          backgroundColor: 'grey.50',
                          borderRadius: 2,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'grey.400'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                            borderWidth: '2px'
                          }
                        }}
                      >
                        <MenuItem value="blank">
                          <Stack spacing={0.5}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>Blank</Typography>
                            <Typography variant="caption" color="text.secondary">Start with an empty page</Typography>
                          </Stack>
                        </MenuItem>
                        <MenuItem value="sermons">
                          <Stack spacing={0.5}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>Sermons</Typography>
                            <Typography variant="caption" color="text.secondary">Pre-built sermon listing page</Typography>
                          </Stack>
                        </MenuItem>
                        <MenuItem value="about">
                          <Stack spacing={0.5}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>About Us</Typography>
                            <Typography variant="caption" color="text.secondary">Church information template</Typography>
                          </Stack>
                        </MenuItem>
                        <MenuItem value="donate">
                          <Stack spacing={0.5}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>Donate</Typography>
                            <Typography variant="caption" color="text.secondary">Donation page template</Typography>
                          </Stack>
                        </MenuItem>
                        <MenuItem value="location">
                          <Stack spacing={0.5}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>Location</Typography>
                            <Typography variant="caption" color="text.secondary">Visit us page with map</Typography>
                          </Stack>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                )}
              </Stack>
            </Box>
          )}

          {/* Action Buttons */}
          <Box sx={{ pt: 2 }}>
            <Divider sx={{ mb: 3 }} />
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', sm: 'center' }}
            >
              {/* Secondary Actions */}
              <Stack direction="row" spacing={1} alignItems="center">
                {page.id && (
                  <>
                    <Button
                      variant="outlined"
                      size="medium"
                      startIcon={<ContentCopyIcon />}
                      onClick={handleDuplicate}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 500,
                        borderRadius: 2,
                        color: 'text.secondary',
                        borderColor: 'grey.300',
                        '&:hover': {
                          borderColor: 'grey.400',
                          backgroundColor: 'grey.50'
                        }
                      }}
                      data-testid="duplicate-page-link"
                      aria-label="Duplicate page"
                    >
                      Duplicate
                    </Button>
                    <Button
                      variant="outlined"
                      size="medium"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleDelete}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 500,
                        borderRadius: 2,
                        borderColor: 'error.light',
                        color: 'error.main',
                        '&:hover': {
                          borderColor: 'error.main',
                          backgroundColor: 'error.light'
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </Stack>

              {/* Primary Actions */}
              <Stack direction="row" spacing={2} alignItems="center">
                <Button
                  variant="outlined"
                  size="medium"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    borderRadius: 2,
                    minWidth: 100,
                    borderColor: 'error.main',
                    color: 'error.main',
                    '&:hover': {
                      borderColor: 'error.dark',
                      backgroundColor: 'error.main',
                      color: 'white'
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  size="medium"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    minWidth: 120,
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    '&:hover': {
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)'
                    }
                  }}
                >
                  {page.id ? 'Update Page' : 'Create Page'}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
