"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Box, Typography, Stack, Button } from "@mui/material";
import { VideoLibrary as VideoLibraryIcon, Add as AddIcon, Search as SearchIcon } from "@mui/icons-material";
import { ImageEditor } from "@churchapps/apphelper/dist/components/ImageEditor";
import { Permissions } from "@churchapps/helpers";
import { UserHelper } from "@churchapps/apphelper/dist/helpers/UserHelper";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { ConfigHelper, ConfigurationInterface } from "@/helpers/ConfigHelper";
import { Playlists } from "@/components/admin/video/Playlists";

type PageParams = {sdSlug:string }

export default function AdminPagesClient() {
  const [config, setConfig] = useState<ConfigurationInterface>(null);
  const [photoType, setPhotoType] = useState<string>(null);
  const [photoUrl, setPhotoUrl] = useState<string>(null);
  const [showAddPlaylist, setShowAddPlaylist] = useState<boolean>(false);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const params = useParams<PageParams>()

  const loadData = () => {
    ConfigHelper.load(params.sdSlug).then((data) => { setConfig(data); });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePhotoUpdated = (dataUrl: string) => {
    setPhotoUrl(dataUrl);
    setPhotoType(photoType);
  };

  const imageEditor = (photoUrl || photoUrl === "") && (
    <ImageEditor
      aspectRatio={16 / 9}
      photoUrl={photoUrl}
      onCancel={() => { setPhotoUrl(null); setPhotoType(null) }}
      onUpdate={handlePhotoUpdated}
      outputWidth={640}
      outputHeight={360}
    />
  );


  const showPhotoEditor = (pType: string, url: string) => {
    setPhotoUrl(url);
    setPhotoType(pType);
  };



  return (
    <AdminWrapper config={config}>
      {/* Modern Header Following Style Guide */}
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
              <VideoLibraryIcon sx={{ fontSize: 32, color: '#FFF' }} />
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
                Playlists
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: { xs: '0.875rem', md: '1rem' }
                }}
              >
                Manage video playlists and organize your content
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            <Button
              variant="outlined"
              startIcon={<SearchIcon />}
              onClick={() => setShowSearch(!showSearch)}
              sx={{
                color: '#FFF',
                borderColor: showSearch ? '#FFF' : 'rgba(255,255,255,0.5)',
                backgroundColor: showSearch ? 'rgba(255,255,255,0.1)' : 'transparent',
                '&:hover': {
                  borderColor: '#FFF',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Search
            </Button>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setShowAddPlaylist(true)}
              sx={{
                color: '#FFF',
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': {
                  borderColor: '#FFF',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Add Playlist
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Content */}
      <Box sx={{ p: 3 }}>
        {imageEditor}
        {UserHelper.checkAccess(Permissions.contentApi.streamingServices.edit) && (
          <Playlists
            showPhotoEditor={showPhotoEditor}
            updatedPhoto={(photoType === "playlist" && photoUrl) || null}
            triggerAdd={showAddPlaylist}
            onAddTriggered={() => setShowAddPlaylist(false)}
            showSearch={showSearch}
          />
        )}
      </Box>
    </AdminWrapper>
  );
}
