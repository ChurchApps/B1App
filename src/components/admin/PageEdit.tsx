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
  IconButton,
  InputLabel,
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
  Alert
} from "@mui/material";
import {
  Edit as EditIcon,
  Article as ArticleIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  Link as LinkIcon
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
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'grey.200'
    }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <ArticleIcon sx={{ color: 'black' }} />
          <Typography variant="h6" sx={{ fontWeight: 400, color: 'black' }}>
            Edit Page
          </Typography>
        </Stack>
      </Box>

      {/* Content */}
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Error Messages */}
          {errors.length > 0 && (
            <Alert severity="error" data-testid="page-errors">
              <Stack spacing={1}>
                {errors.map((error, index) => (
                  <Typography key={index} variant="body2">
                    {error}
                  </Typography>
                ))}
              </Stack>
            </Alert>
          )}

          {/* Title Field */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0, fontWeight: 600 }}>
              Title
            </Typography>
            <TextField
              fullWidth
              name="title"
              value={page.title || ''}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              data-testid="page-title-input"
              aria-label="Page title"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'grey.50',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'grey.400'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                    borderWidth: '1px'
                  }
                }
              }}
            />
          </Box>

          {/* URL Field */}
          {checked ? (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                URL Path
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: 'grey.50',
                  border: '1px solid',
                  borderColor: 'grey.200',
                  borderRadius: 1
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <LinkIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {page.url}
                  </Typography>
                </Stack>
              </Paper>
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Preview:
                  <a
                    href={`https://${UserHelper.currentUserChurch.church.subDomain}.b1.church${page.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginLeft: '4px', color: 'inherit' }}
                  >
                    {`https://${UserHelper.currentUserChurch.church.subDomain}.b1.church${page.url}`}
                  </a>
                </Typography>
              </Box>
            </Box>
          ) : (
            <TextField
              fullWidth
              label="URL Path"
              name="url"
              value={page.url || ''}
              onChange={handleChange}
              helperText="ex: /camper-registration (**Make sure to check before saving)"
              InputProps={{
                endAdornment: (
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={handleSlugValidation}
                    data-testid="check-url-button"
                    aria-label="Check URL validity"
                    sx={{ ml: 1 }}
                  >
                    Check
                  </Button>
                )
              }}
              data-testid="page-url-input"
              aria-label="Page URL path"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'grey.50',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'grey.400'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                    borderWidth: '1px'
                  }
                }
              }}
            />
          )}

          {/* Layout Field (only if not embedded) */}
          {!props.embedded && (
            <FormControl fullWidth variant="outlined">
              <InputLabel>Layout</InputLabel>
              <Select
                fullWidth
                label="Layout"
                value={page.layout || ""}
                name="layout"
                onChange={handleChange}
                data-testid="page-layout-select"
                aria-label="Select page layout"
              >
                <MenuItem value="headerFooter">Header & Footer</MenuItem>
                <MenuItem value="cleanCentered">Clean Centered Content</MenuItem>
              </Select>
            </FormControl>
          )}

          {/* Page Template Field (only for new pages not embedded) */}
          {!props.embedded && showPageTemplate === true && (
            <FormControl fullWidth variant="outlined">
              <InputLabel>Page Template</InputLabel>
              <Select
                fullWidth
                label="Page Template"
                name="pageTemplate"
                value={pageTemplate}
                onChange={(e) => setPageTemplate(e.target.value)}
                data-testid="page-template-select"
                aria-label="Select page template"
              >
                <MenuItem value="blank">Blank</MenuItem>
                <MenuItem value="sermons">Sermons</MenuItem>
                <MenuItem value="about">About Us</MenuItem>
                <MenuItem value="donate">Donate</MenuItem>
                <MenuItem value="location">Location</MenuItem>
              </Select>
            </FormControl>
          )}

          {/* Action Buttons */}
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
            {page.id && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<ContentCopyIcon />}
                onClick={handleDuplicate}
                sx={{
                  textTransform: 'none',
                  minWidth: 'auto'
                }}
                data-testid="duplicate-page-link"
                aria-label="Duplicate page"
              >
                Duplicate
              </Button>
            )}
            <Button
              variant="outlined"
              size="small"
              color="error"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              sx={{
                textTransform: 'none',
                minWidth: 'auto',
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
              size="small"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              sx={{
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Save
            </Button>
            {page.id && (
              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
                sx={{
                  textTransform: 'none',
                  minWidth: 'auto'
                }}
              >
                Delete
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
