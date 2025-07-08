import { Loading } from "@churchapps/apphelper/dist/components/Loading";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import { UserHelper } from "@churchapps/apphelper/dist/helpers/UserHelper";
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
  Paper
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  VideoLibrary as VideoLibraryIcon
} from "@mui/icons-material";
import React from "react";
import { PlaylistEdit } from "./PlaylistEdit";

interface Props {
  showPhotoEditor: (photoType: string, url: string) => void;
  updatedPhoto: string;
  triggerAdd: boolean;
  onAddTriggered: () => void;
}

export const Playlists = (props: Props) => {
  const [playlists, setPlaylists] = React.useState<PlaylistInterface[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = React.useState<PlaylistInterface>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const handleUpdated = () => {
    setCurrentPlaylist(null);
    loadData();
  };

  const loadData = () => {
    ApiHelper.get("/playlists", "ContentApi").then((data) => {
      setPlaylists(data);
      setIsLoading(false);
    });
  };

  const handleAdd = () => {
    let v: PlaylistInterface = { churchId: UserHelper.currentUserChurch.church.id, title: "New Playlist", description: "", publishDate: new Date(), thumbnail: "" };
    setCurrentPlaylist(v);
    loadData();
  };

  const getTableRows = () => playlists.map((playlist) => (
    <TableRow
      key={playlist.id}
      sx={{
        '&:hover': { backgroundColor: 'action.hover' },
        transition: 'background-color 0.2s ease'
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
        <IconButton
          size="small"
          onClick={() => setCurrentPlaylist(playlist)}
          sx={{
            color: 'primary.main',
            '&:hover': { backgroundColor: 'primary.light', opacity: 0.1 }
          }}
        >
          <EditIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  ));

  const getEmptyState = () => (
    <TableRow>
      <TableCell colSpan={2} sx={{ textAlign: 'center', py: 6 }}>
        <Stack spacing={2} alignItems="center">
          <VideoLibraryIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
          <Typography variant="h6" color="text.secondary">
            No playlists found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Get started by creating your first playlist
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            data-testid="add-playlist-button"
          >
            Create First Playlist
          </Button>
        </Stack>
      </TableCell>
    </TableRow>
  );

  const getTable = () => {
    if (isLoading) return <Loading />;

    return (
      <TableContainer component={Paper}>
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
            {playlists.length === 0 ? getEmptyState() : getTableRows()}
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
        {getTable()}
      </CardContent>
    </Card>
  );
};
