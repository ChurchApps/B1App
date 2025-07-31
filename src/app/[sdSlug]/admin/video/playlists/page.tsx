"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Box, Stack, Button } from "@mui/material";
import { VideoLibrary as VideoLibraryIcon, Add as AddIcon, Search as SearchIcon } from "@mui/icons-material";
import { ImageEditor } from "@churchapps/apphelper";
import { PageHeader } from "@churchapps/apphelper";
import { Permissions } from "@churchapps/helpers";
import { UserHelper } from "@churchapps/apphelper";
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
      <PageHeader
        icon={<VideoLibraryIcon />}
        title="Playlists"
        subtitle="Manage video playlists and organize your content"
      >
        <Stack direction="row" spacing={1}>
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
      </PageHeader>

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
