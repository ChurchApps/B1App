import { Loading } from "@churchapps/apphelper/dist/components/Loading";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import { UserHelper } from "@churchapps/apphelper/dist/helpers/UserHelper";
import { ArrayHelper } from "@churchapps/apphelper/dist/helpers/ArrayHelper";
import { DateHelper } from "@churchapps/apphelper/dist/helpers/DateHelper";
import type { SermonInterface, PlaylistInterface } from "@churchapps/helpers";
import { Box, Button, Card, CardContent, Chip, Icon, IconButton, InputAdornment, Menu, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from "@mui/material";
import { Add as AddIcon, CalendarMonth as CalendarIcon, LiveTv as LiveTvIcon, PlaylistPlay as PlaylistIcon, Search as SearchIcon, ArrowDropDown as ArrowDropDownIcon } from "@mui/icons-material";
import React from "react";
import { SermonEdit } from "./SermonEdit";

interface Props {
  showPhotoEditor: (photoType: string, url: string) => void,
  updatedPhoto: string
}

export const Sermons = (props: Props) => {
  const [sermons, setSermons] = React.useState<SermonInterface[]>([]);
  const [filteredSermons, setFilteredSermons] = React.useState<SermonInterface[]>([]);
  const [playlists, setPlaylists] = React.useState<PlaylistInterface[]>([]);
  const [currentSermon, setCurrentSermon] = React.useState<SermonInterface>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleUpdated = () => { setCurrentSermon(null); loadData(); }

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAddSermon = () => {
    handleMenuClose();
    handleAdd(false);
  };

  const handleAddPermanentLiveUrl = () => {
    handleMenuClose();
    handleAdd(true);
  };

  const getActionButtons = () => (
    <>
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        endIcon={<ArrowDropDownIcon />}
        onClick={handleMenuClick}
        data-testid="add-sermon-button"
        sx={{
          color: '#FFF',
          borderColor: 'rgba(255,255,255,0.5)',
          '&:hover': {
            borderColor: '#FFF',
            backgroundColor: 'rgba(255,255,255,0.1)'
          }
        }}
      >
        Add Sermon
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleAddSermon}>
          <Stack direction="row" spacing={1} alignItems="center">
            <LiveTvIcon fontSize="small" />
            <Typography>Add Sermon</Typography>
          </Stack>
        </MenuItem>
        <MenuItem onClick={handleAddPermanentLiveUrl}>
          <Stack direction="row" spacing={1} alignItems="center">
            <LiveTvIcon fontSize="small" sx={{ color: 'error.main' }} />
            <Typography>Add Permanent Live URL</Typography>
          </Stack>
        </MenuItem>
      </Menu>
    </>
  );

  const loadData = () => {
    ApiHelper.get("/playlists", "ContentApi").then(data => { setPlaylists(data); });
    ApiHelper.get("/sermons", "ContentApi").then(data => {
      setSermons(data);
      setFilteredSermons(data);
      setIsLoading(false);
    });
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value === "") {
      setFilteredSermons(sermons);
    } else {
      const filtered = sermons.filter(sermon => {
        const playlistTitle = getPlaylistTitle(sermon.playlistId);
        return (
          sermon.title.toLowerCase().includes(value.toLowerCase())
          || playlistTitle.toLowerCase().includes(value.toLowerCase())
        );
      });
      setFilteredSermons(filtered);
    }
  }

  const handleAdd = (permanentUrl: boolean) => {
    let v: SermonInterface = { churchId: UserHelper.currentUserChurch.church.id, duration: 5400, videoType: "youtube", videoData: "", title: "New Sermon", permanentUrl }
    if (permanentUrl) {
      v.videoType = "youtube_channel";
      v.videoData = "This is not your channel url - See help link above";
      v.title = "Current Live Service";
    }
    setCurrentSermon(v);
    loadData();
  }

  const getPlaylistTitle = (playlistId: string) => {
    let result = "";
    if (playlists) {
      const p: PlaylistInterface = ArrayHelper.getOne(playlists, "id", playlistId);
      if (p) result = p.title;
    }
    return result;
  }


  const getRows = () => {
    let rows: React.ReactElement[] = [];
    filteredSermons.forEach(video => {
      rows.push(
        <TableRow
          key={video.id}
          sx={{
            '&:hover': { backgroundColor: 'action.hover' },
            transition: 'background-color 0.2s ease'
          }}
        >
          <TableCell>
            <Stack direction="row" spacing={1} alignItems="center">
              <PlaylistIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2">
                {getPlaylistTitle(video.playlistId) || "No Playlist"}
              </Typography>
            </Stack>
          </TableCell>
          <TableCell>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {video.title}
            </Typography>
          </TableCell>
          <TableCell>
            <Stack direction="row" spacing={1} alignItems="center">
              <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {(video.publishDate) ? DateHelper.prettyDate(DateHelper.toDate(video.publishDate)) : "Not scheduled"}
              </Typography>
            </Stack>
          </TableCell>
          <TableCell align="right">
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => { setCurrentSermon(video); }}
                data-testid={`edit-sermon-${video.id}`}
                aria-label={`Edit ${video.title}`}
                sx={{ color: 'primary.main' }}
              >
                <Icon>edit</Icon>
              </IconButton>
            </Tooltip>
          </TableCell>
        </TableRow>
      );
    })
    return rows;
  }

  const getEmptyState = () => (
    <TableRow>
      <TableCell colSpan={4} sx={{ textAlign: 'center', py: 8 }}>
        <Stack spacing={2} alignItems="center">
          <LiveTvIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
          <Typography variant="h6" color="text.secondary">
            {searchTerm ? "No sermons found" : "No sermons yet"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first sermon"}
          </Typography>
          {!searchTerm && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleAdd(false)}
            >
              Add First Sermon
            </Button>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );

  const getTable = () => {
    if (isLoading) return <Loading data-testid="sermons-loading" />
    else return (
      <Table sx={{ minWidth: 650 }}>
        <TableHead
          sx={{
            backgroundColor: 'grey.50',
            '& .MuiTableCell-root': {
              borderBottom: '2px solid',
              borderBottomColor: 'divider',
              fontWeight: 600
            }
          }}
        >
          <TableRow>
            <TableCell sx={{ width: '25%' }}>Playlist</TableCell>
            <TableCell sx={{ width: '45%' }}>Sermon</TableCell>
            <TableCell sx={{ width: '25%' }}>Publish Date</TableCell>
            <TableCell sx={{ width: '5%' }}></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredSermons.length === 0 ? getEmptyState() : getRows()}
        </TableBody>
      </Table>
    );
  }

  React.useEffect(() => { loadData(); }, []);

  if (currentSermon !== null) return <SermonEdit currentSermon={currentSermon} updatedFunction={handleUpdated} showPhotoEditor={props.showPhotoEditor} updatedPhoto={props.updatedPhoto} />;
  else return (
    <>
      {/* Header */}
      <Box sx={{ backgroundColor: "var(--c1l2)", color: "#FFF", padding: "24px", mb: 3 }}>
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
              <LiveTvIcon sx={{ fontSize: 32, color: '#FFF' }} />
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
                Sermons
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography
                  variant="body1"
                  sx={{
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: { xs: '0.875rem', md: '1rem' }
                  }}
                >
                  Manage your sermon library and live streams
                </Typography>
                {sermons.length > 0 && (
                  <Chip
                    label={`${sermons.length} ${sermons.length === 1 ? 'sermon' : 'sermons'}`}
                    size="small"
                    sx={{
                      backgroundColor: "rgba(255,255,255,0.2)",
                      color: "#FFF",
                      fontSize: '0.75rem',
                      height: 20
                    }}
                  />
                )}
              </Stack>
            </Box>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              flexShrink: 0,
              justifyContent: { xs: "flex-start", md: "flex-end" },
              width: { xs: "100%", md: "auto" }
            }}
          >
            {getActionButtons()}
          </Stack>
        </Stack>
      </Box>

      {/* Content */}
      <Box sx={{ px: 3 }}>
        <Card sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'grey.200'
        }}>
          {/* Search Bar */}
          {sermons.length > 0 && (
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <TextField
                fullWidth
                placeholder="Search sermons by title or playlist..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ maxWidth: 400 }}
              />
            </Box>
          )}

          <CardContent sx={{ p: 0 }}>
            {getTable()}
          </CardContent>
        </Card>
      </Box>
    </>
  );
}
