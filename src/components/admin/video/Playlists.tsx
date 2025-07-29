import { Loading } from "@churchapps/apphelper";
import { ApiHelper } from "@churchapps/apphelper";
import { UserHelper } from "@churchapps/apphelper";
import type { PlaylistInterface } from "@churchapps/helpers";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Box,
  Tooltip
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  VideoLibrary as VideoLibraryIcon,
  Search as SearchIcon
} from "@mui/icons-material";
import React from "react";
import { PlaylistEdit } from "./PlaylistEdit";

interface Props {
  showPhotoEditor: (photoType: string, url: string) => void;
  updatedPhoto: string;
  triggerAdd: boolean;
  onAddTriggered: () => void;
  showSearch: boolean;
}

export const Playlists = (props: Props) => {
  const [playlists, setPlaylists] = React.useState<PlaylistInterface[]>([]);
  const [filteredPlaylists, setFilteredPlaylists] = React.useState<PlaylistInterface[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = React.useState<PlaylistInterface>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState<string>("");

  const handleUpdated = () => {
    setCurrentPlaylist(null);
    loadData();
  };

  const loadData = () => {
    ApiHelper.get("/playlists", "ContentApi").then((data: any) => {
      setPlaylists(data);
      setFilteredPlaylists(data);
      setIsLoading(false);
    });
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);

    if (term === "") {
      setFilteredPlaylists(playlists);
    } else {
      const filtered = playlists.filter((playlist: any) =>
        playlist.title.toLowerCase().includes(term)
        || (playlist.description && playlist.description.toLowerCase().includes(term))
      );
      setFilteredPlaylists(filtered);
    }
  };

  const handleAdd = () => {
    let v: PlaylistInterface = { churchId: UserHelper.currentUserChurch.church.id, title: "New Playlist", description: "", publishDate: new Date(), thumbnail: "" };
    setCurrentPlaylist(v);
    loadData();
  };

  const getTableRows = () => filteredPlaylists.map((playlist, index) => (
    <TableRow
      key={playlist.id}
      sx={{
        '&:hover': { backgroundColor: 'action.hover' },
        transition: 'background-color 0.2s ease',
        '&:last-child td': {
          borderBottom: 0
        }
      }}
    >
      <TableCell>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {playlist.title}
        </Typography>
        {playlist.description && (
          <Typography variant="body2" color="text.secondary">
            {playlist.description}
          </Typography>
        )}
      </TableCell>
      <TableCell align="right">
        <Tooltip title="Edit playlist" arrow>
          <IconButton
            size="small"
            onClick={() => setCurrentPlaylist(playlist)}
            sx={{
              color: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'white',
                transform: 'scale(1.05)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  ));

  const getEmptyState = () => {
    const isSearching = searchTerm.length > 0;

    return (
      <TableRow>
        <TableCell colSpan={2} sx={{ textAlign: 'center', py: 6, borderBottom: 0 }}>
          <Stack spacing={2} alignItems="center">
            <VideoLibraryIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
            <Typography variant="h6" color="text.secondary">
              {isSearching ? 'No playlists match your search' : 'No playlists found'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {isSearching ? 'Try adjusting your search terms' : 'Get started by creating your first playlist'}
            </Typography>
            {!isSearching && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAdd}
                data-testid="add-playlist-button"
              >
                Create First Playlist
              </Button>
            )}
          </Stack>
        </TableCell>
      </TableRow>
    );
  };

  const getTable = () => {
    if (isLoading) return <Loading />;

    return (
      <TableContainer>
        <Table sx={{ minWidth: 650 }}>
          <TableHead
            sx={{
              backgroundColor: 'grey.50',
              '& .MuiTableCell-root': {
                borderBottom: '2px solid',
                borderBottomColor: 'divider'
              }
            }}
          >
            <TableRow>
              <TableCell>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Playlist
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Actions
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPlaylists.length === 0 ? getEmptyState() : getTableRows()}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  React.useEffect(() => {
    loadData();
  }, []);

  React.useEffect(() => {
    if (props.triggerAdd) {
      handleAdd();
      props.onAddTriggered();
    }
  }, [props.triggerAdd]);

  React.useEffect(() => {
    if (searchTerm === "") {
      setFilteredPlaylists(playlists);
    }
  }, [playlists, searchTerm]);

  React.useEffect(() => {
    if (!props.showSearch) {
      setSearchTerm("");
      setFilteredPlaylists(playlists);
    }
  }, [props.showSearch, playlists]);

  if (currentPlaylist !== null) {
    return (
      <PlaylistEdit
        currentPlaylist={currentPlaylist}
        updatedFunction={handleUpdated}
        showPhotoEditor={props.showPhotoEditor}
        updatedPhoto={props.updatedPhoto}
      />
    );
  }

  return (
    <Card sx={{
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'grey.200'
    }}>
      <CardContent sx={{ p: 0 }}>
        {/* Search Bar - Conditionally Rendered */}
        {props.showSearch && (
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search playlists..."
              value={searchTerm}
              onChange={handleSearch}
              size="small"
              autoFocus
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'grey.50'
                }
              }}
            />
          </Box>
        )}

        {getTable()}
      </CardContent>
    </Card>
  );
};
