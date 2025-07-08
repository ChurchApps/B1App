"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Typography,
  Stack,
  Button,
  Grid,
  Card,
  CardContent,
  Paper
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  YouTube as YouTubeIcon,
  VideoLibrary as VimeoIcon,
  ArrowBack as ArrowBackIcon
} from "@mui/icons-material";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { ConfigHelper, ConfigurationInterface } from "@/helpers/ConfigHelper";
import { VimeoImport } from "@/components/admin/video/VimeoImport";
import { YouTubeImport } from "@/components/admin/video/YouTubeImport";

type PageParams = {sdSlug:string }

export default function AdminPagesClient() {
  const [config, setConfig] = useState<ConfigurationInterface>(null);
  const params = useParams<PageParams>()
  const [importType, setImportType] = useState<"youtube" | "vimeo" | "">();

  const loadData = () => {
    ConfigHelper.load(params.sdSlug).then((data) => { setConfig(data); });
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AdminWrapper config={config}>
      {/* Modern Header following style guide */}
      <Box sx={{ backgroundColor: "var(--c1l2)", color: "#FFF", padding: "24px" }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 2, md: 4 }}
          alignItems={{ xs: "flex-start", md: "center" }}
          sx={{ width: "100%" }}
        >
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
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
              <CloudUploadIcon sx={{ fontSize: 32, color: '#FFF' }} />
            </Box>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 600,
                  mb: 0.5,
                  fontSize: { xs: '1.75rem', md: '2.125rem' }
                }}
              >
                Bulk Import
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: { xs: '0.875rem', md: '1rem' }
                }}
              >
                Import videos from external platforms in bulk
              </Typography>
            </Box>
          </Stack>
          {importType && (
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => setImportType("")}
                sx={{
                  color: '#FFF',
                  borderColor: 'rgba(255,255,255,0.5)',
                  '&:hover': {
                    borderColor: '#FFF',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Back to Selection
              </Button>
            </Stack>
          )}
        </Stack>
      </Box>

      {/* Main Content */}
      <Box sx={{ p: 3 }}>
        {importType
          ? (<>
            {importType === "youtube"
              ? (<YouTubeImport handleDone={() => setImportType("")} />)
              : (<VimeoImport handleDone={() => setImportType("")} />)
            }
          </>)
          : (
            <Box sx={{ maxWidth: 800, mx: 'auto' }}>
              <Card sx={{
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'grey.200'
              }}>
                <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider" }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CloudUploadIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      Choose Import Source
                    </Typography>
                  </Stack>
                </Box>
                <CardContent sx={{ p: 4 }}>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 4,
                          textAlign: 'center',
                          border: '2px dashed',
                          borderColor: 'grey.300',
                          borderRadius: 2,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            borderColor: 'primary.main',
                            backgroundColor: 'primary.50',
                            transform: 'translateY(-2px)',
                            boxShadow: 2
                          }
                        }}
                        onClick={() => setImportType("youtube")}
                        data-testid="import-youtube-button"
                      >
                        <Stack spacing={2} alignItems="center">
                          <Box
                            sx={{
                              backgroundColor: '#FF0000',
                              borderRadius: '12px',
                              p: 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <YouTubeIcon sx={{ fontSize: 40, color: '#FFF' }} />
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            YouTube
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200 }}>
                            Import videos from your YouTube channel or playlists
                          </Typography>
                          <Button
                            variant="contained"
                            size="large"
                            sx={{
                              backgroundColor: '#FF0000',
                              '&:hover': { backgroundColor: '#CC0000' },
                              textTransform: 'none',
                              fontWeight: 600
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setImportType("youtube");
                            }}
                          >
                            Import from YouTube
                          </Button>
                        </Stack>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 4,
                          textAlign: 'center',
                          border: '2px dashed',
                          borderColor: 'grey.300',
                          borderRadius: 2,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            borderColor: 'primary.main',
                            backgroundColor: 'primary.50',
                            transform: 'translateY(-2px)',
                            boxShadow: 2
                          }
                        }}
                        onClick={() => setImportType("vimeo")}
                        data-testid="import-vimeo-button"
                      >
                        <Stack spacing={2} alignItems="center">
                          <Box
                            sx={{
                              backgroundColor: '#1AB7EA',
                              borderRadius: '12px',
                              p: 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <VimeoIcon sx={{ fontSize: 40, color: '#FFF' }} />
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            Vimeo
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200 }}>
                            Import videos from your Vimeo account or showcases
                          </Typography>
                          <Button
                            variant="contained"
                            size="large"
                            sx={{
                              backgroundColor: '#1AB7EA',
                              '&:hover': { backgroundColor: '#1593C4' },
                              textTransform: 'none',
                              fontWeight: 600
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setImportType("vimeo");
                            }}
                          >
                            Import from Vimeo
                          </Button>
                        </Stack>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          )}
      </Box>
    </AdminWrapper>
  );
}
