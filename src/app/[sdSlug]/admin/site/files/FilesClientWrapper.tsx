"use client";

import { useEffect, useState } from "react";
import { FileInterface, WrapperPageProps } from "@/helpers";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { FileUpload } from "@/components/admin/FileUpload";
import { Box, Grid, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { DisplayBox, InputBox, ApiHelper, SmallButton, Banner } from "@churchapps/apphelper";
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
      <>
        <div>Used space: {formatSize(usedSpace)} / 100MB</div>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: '100%', mr: 1 }}>
            <LinearProgress variant="determinate" value={percent} />
          </Box>
          <Box sx={{ minWidth: 35 }}>
            <Typography variant="body2" color="text.secondary">{`${Math.round(percent)}%`}</Typography>
          </Box>
        </Box>
      </>
    );
  };

  useEffect(() => {
    ApiHelper.get("/files", "ContentApi").then((d) => setFiles(d));
  }, []);

  const fileRows = files?.map((file) => (
    <TableRow key={file.id}>
      <TableCell>
        <Link href={file.contentPath} target="_blank">
          {file.fileName}
        </Link>
      </TableCell>
      <TableCell>{formatSize(file.size)}</TableCell>
      <TableCell align="right">
        <SmallButton icon="delete" onClick={() => handleDelete(file)} data-testid={`delete-file-${file.id}-button`} />
      </TableCell>
    </TableRow>
  ));

  return (
    <AdminWrapper config={props.config}>
      <Banner><h1>Manage Your Files</h1></Banner>
      <div id="mainContent">
        <Grid container spacing={3}>
          <Grid size={{ md: 8, xs: 12 }}>
            <DisplayBox headerText="Files" headerIcon="description" data-testid="files-display-box">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>{fileRows}</TableBody>
              </Table>
            </DisplayBox>
          </Grid>
          <Grid size={{ md: 4, xs: 12 }}>
            <InputBox headerIcon="description" headerText="Upload" saveFunction={handleSave} saveText="Upload" data-testid="file-upload-inputbox">
              {getStorage()}
              <p>
                100 MB of storage space is provided for free for storing PDFs and other documents commonly needed for
                church websites. We suggest using Google Drive or Dropbox to store files if additional space is needed.
              </p>
              {usedSpace < 100000000 && (
                <FileUpload contentType="website" contentId="" pendingSave={pendingFileSave} saveCallback={handleFileSaved} />
              )}
            </InputBox>
          </Grid>
        </Grid>
      </div>
    </AdminWrapper>
  );
}
