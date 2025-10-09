"use client";
import { useEffect, useState } from "react";
import { Typography, Breadcrumbs, Button, Grid, Card, CardContent, Box } from "@mui/material";
import FolderCopyIcon from "@mui/icons-material/FolderCopy";
import TopicIcon from "@mui/icons-material/Topic";
import LiveTvIcon from "@mui/icons-material/LiveTv";
import { ApiHelper } from "@churchapps/apphelper";
import { AppearanceHelper } from "@churchapps/apphelper";
import { Loading } from "@churchapps/apphelper";
import type { PlaylistInterface, SermonInterface } from "@churchapps/helpers";
import { EnvironmentHelper } from "@/helpers";

interface Props {
  churchId: string;
  appearance: any;
}

export const SermonElement = ({ churchId, appearance }: Props) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isActive, setIsActive] = useState<string>("playlists");
  const [playlists, setPlaylists] = useState<PlaylistInterface[]>([]);
  const [activePlaylist, setActiveplaylist] = useState<PlaylistInterface>();
  const [sermons, setSermons] = useState<SermonInterface[]>([]);
  const [activeSermons, setActiveSermons] = useState<SermonInterface[]>([]);
  const [activeVideo, setActiveVideo] = useState<SermonInterface>();

  useEffect(() => {
    EnvironmentHelper.init();
    ApiHelper.getAnonymous("/playlists/public/" + churchId, "ContentApi").then((data: any) => {
      setPlaylists(data);
      setIsLoading(false);
    });

    ApiHelper.getAnonymous("/sermons/public/" + churchId, "ContentApi").then((data: any) => {
      setSermons(data);
    });
  }, [churchId]);

  const getFilteredData = (id: string) => {
    const filteredData = sermons.filter((item) => item.playlistId === id);
    setActiveSermons(filteredData);
  };

  if (isLoading) return <Loading />;

  return (
    <>
      <Breadcrumbs>
        <Button
          size="small"
          startIcon={<FolderCopyIcon />}
          variant={isActive === "playlists" ? "contained" : "text"}
          color={isActive === "playlists" ? "primary" : "secondary"}
          sx={{ borderRadius: 3 }}
          onClick={() => {
            setIsActive("playlists");
          }}
          data-testid="sermon-playlists-button"
        >
          Playlists
        </Button>
        {activePlaylist?.title && (
          <Button
            size="small"
            startIcon={<TopicIcon />}
            variant={isActive === "sermons" ? "contained" : "text"}
            color={isActive === "sermons" ? "primary" : "secondary"}
            sx={{ borderRadius: 3 }}
            onClick={() => {
              setIsActive("sermons");
            }}
            data-testid="sermon-topics-button"
          >
            {activePlaylist?.title}
          </Button>
        )}
        {activeVideo?.title && (
          <Button
            size="small"
            startIcon={<LiveTvIcon />}
            variant={isActive === "video" ? "contained" : "text"}
            color={isActive === "video" ? "primary" : "secondary"}
            sx={{ borderRadius: 3 }}
            onClick={() => {
              setIsActive("video");
            }}
            data-testid="sermon-watch-button"
          >
            {activeVideo?.title}
          </Button>
        )}
      </Breadcrumbs>
      <div style={{ marginTop: 15 }}>
        {isActive === "playlists" && (
          <Grid container spacing={3} style={{ paddingBottom: 20, paddingTop: 20 }}>
            {playlists.map((item) => (
              <Grid size={{ md: 4, xs: 12, sm: 6 }} key={item.id}>
                <Card
                  key={item.id}
                  sx={{ maxWidth: 635, borderRadius: 0, boxShadow: 5, cursor: "pointer" }}
                  onClick={() => {
                    setActiveplaylist(item);
                    setIsActive("sermons");
                    getFilteredData(item.id);
                  }}
                >
                  <CardContent>
                    <Box
                      component="img"
                      alt={item?.title}
                      src={item.thumbnail ? item.thumbnail : AppearanceHelper.getLogo(appearance, "/images/logo.png", "/images/logo.png", "#FFF")}
                      height={190}
                      minHeight={{ xs: 230, sm: 'auto' }}
                      sx={{ objectFit: 'cover', objectPosition: 'center' }}
                    />
                    <Typography
                      component="h3"
                      sx={{ fontSize: "24px", fontWeight: 500, marginBottom: "2px", marginTop: "6px", color: "#333", overflowY: "hidden", maxHeight: 30 }}
                    >
                      {item.title}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
        {isActive === "sermons" && activeSermons && (
          <Grid container spacing={3} style={{ paddingBottom: 20, paddingTop: 20 }}>
            {activeSermons.map((item) => (
              <Grid size={{ md: 4, xs: 12 }} key={item.id}>
                <Card
                  key={item.id}
                  sx={{ maxWidth: 635, borderRadius: 0, boxShadow: 5, cursor: "pointer" }}
                  onClick={() => {
                    setIsActive("video");
                    setActiveVideo(item);
                  }}
                >
                  <CardContent>
                    <Box
                      component="img"
                      alt={item?.title}
                      src={item.thumbnail ? item.thumbnail : (activePlaylist?.thumbnail ? activePlaylist.thumbnail : AppearanceHelper.getLogo(appearance, "/images/logo.png", "/images/logo.png", "#FFF"))}
                      height={190}
                      minHeight={{ xs: 230, sm: 'auto' }}
                      sx={{ objectFit: 'cover', objectPosition: 'center' }}
                    />
                    <Typography
                      component="h3"
                      sx={{ fontSize: "24px", fontWeight: 500, marginBottom: "2px", marginTop: "6px", color: "#333", overflowY: "hidden", maxHeight: 30 }}
                    >
                      {item.title}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
        {isActive === "video" && activeVideo && (
          <div className="videoWrapper">
            <iframe
              src={activeVideo.videoUrl.replace("controls=0", "controls=1")}
              allowFullScreen
              style={{ border: 0 }}
            />
          </div>
        )}
      </div>
    </>
  );
};
