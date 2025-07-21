"use client";

import { useEffect, useState } from "react";
import { FileInterface, WrapperPageProps } from "@/helpers";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { FileUpload } from "@/components/admin/FileUpload";
import { Box, Grid, Table, TableBody, TableCell, TableHead, TableRow, Typography, Stack, Card } from "@mui/material";
import { InputBox } from "@churchapps/apphelper/dist/components/InputBox";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import { SmallButton } from "@churchapps/apphelper/dist/components/SmallButton";
import { Folder as FolderIcon, CloudUpload as CloudUploadIcon, InsertDriveFile as FileIcon } from "@mui/icons-material";
import Link from "next/link";
import LinearProgress from '@mui/material/LinearProgress';

export function FilesClientWrapper(props: WrapperPageProps) {
  const [pendingFileSave, setPendingFileSave] = useState(false);
  const [files, setFiles] = useState<FileInterface[]>(null);


  let usedSpace = 0;
  files?.forEach((f) => (usedSpace += f.size));

  const handleFileSaved = (file: FileInterface) => {
    setPendingFileSave(false);
    loadData();
  };

  const handleSave = () => {
    setPendingFileSave(true);
  };

  const loadData = () => {
    ApiHelper.get("/files", "ContentApi").then((d) => setFiles(d));
  };

  const handleDelete = async (file: FileInterface) => {
    if (confirm("Are you sure you wish to delete '" + file.fileName + "'?")) {
      await ApiHelper.delete("/files/" + file.id, "ContentApi");
      loadData();
    }
  };

  const formatSize = (bytes: number) => {
    let result = bytes.toString() + "b";
    if (bytes > 1000000) result = (Math.round(bytes / 10000) / 100).toString() + "MB";
    else if (bytes > 1000) result = (Math.round(bytes / 10) / 100).toString() + "KB";
    return result;
  };

  const getStorage = () => {
    const percent = (usedSpace / 100000000) * 100;
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Storage: {formatSize(usedSpace)} / 100MB
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: '100%', mr: 1 }}>
            <LinearProgress
              variant="determinate"
              value={percent}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
          <Box sx={{ minWidth: 35 }}>
            <Typography variant="body2" color="text.secondary">
              {`${Math.round(percent)}%`}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  useEffect(() => {
    ApiHelper.get("/files", "ContentApi").then((d) => setFiles(d));
  }, []);

  const fileRows = files?.length > 0
    ? files.map((file) => (
      <TableRow
        key={file.id}
        sx={{
          '&:hover': { backgroundColor: 'action.hover' },
          transition: 'background-color 0.2s ease'
        }}
      >
        <TableCell>
          <Stack direction="row" spacing={1} alignItems="center">
            <FileIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Link href={file.contentPath} target="_blank" style={{ textDecoration: 'none' }}>
              <Typography
                variant="body2"
                sx={{
                  color: 'primary.main',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                {file.fileName}
              </Typography>
            </Link>
          </Stack>
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {formatSize(file.size)}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <SmallButton
            icon="delete"
            onClick={() => handleDelete(file)}
            data-testid={`delete-file-${file.id}-button`}
          />
        </TableCell>
      </TableRow>
    ))
    : (
      <TableRow>
        <TableCell colSpan={3} sx={{ textAlign: 'center', py: 4 }}>
          <Stack spacing={2} alignItems="center">
            <FolderIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
            <Typography variant="body1" color="text.secondary">
              No files uploaded yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Get started by uploading your first file
            </Typography>
          </Stack>
        </TableCell>
      </TableRow>
    );

  return (
    <AdminWrapper config={props.config}>
      {/* Modern Header */}
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
              <FolderIcon sx={{ fontSize: 32, color: '#FFF' }} />
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
                File Manager
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: { xs: '0.875rem', md: '1rem' }
                }}
              >
                Manage your website files and documents
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <CloudUploadIcon sx={{ color: "#FFF", fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                {formatSize(usedSpace)} / 100MB used
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Box>

      {/* Main Content */}
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ md: 8, xs: 12 }}>
            <Card sx={{
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'grey.200'
            }}>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <FileIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      Files
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {files?.length || 0} file{files?.length !== 1 ? 's' : ''}
                  </Typography>
                </Stack>
              </Box>
              <Box sx={{ p: 0 }}>
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
                          Name
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Size
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Actions
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody data-testid="files-table-body">
                    {fileRows}
                  </TableBody>
                </Table>
              </Box>
            </Card>
          </Grid>
          <Grid size={{ md: 4, xs: 12 }}>
            <InputBox
              headerIcon="cloud_upload"
              headerText="Upload Files"
              saveFunction={handleSave}
              saveText="Upload"
              data-testid="file-upload-inputbox"
            >
              {getStorage()}
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                100 MB of storage space is provided for free for storing PDFs and other documents commonly needed for
                church websites. We suggest using Google Drive or Dropbox to store files if additional space is needed.
              </Typography>
              {usedSpace < 100000000 && (
                <Box sx={{
                  border: '2px dashed',
                  borderColor: 'grey.300',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover'
                  },
                  transition: 'all 0.2s ease'
                }}>
                  <FileUpload
                    contentType="website"
                    contentId=""
                    pendingSave={pendingFileSave}
                    saveCallback={handleFileSaved}
                  />
                </Box>
              )}
            </InputBox>
          </Grid>
        </Grid>
      </Box>
    </AdminWrapper>
  );
}
