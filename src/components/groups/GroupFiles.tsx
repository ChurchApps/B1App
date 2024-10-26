"use client";
import React, { useEffect, useState } from "react";
import { ApiHelper, DisplayBox, InputBox, SmallButton, UserContextInterface, UserHelper } from "@churchapps/apphelper";
import { FileInterface } from "@/helpers";
import { Box, LinearProgress, Typography, TableRow, TableCell, Table, TableHead, TableBody } from "@mui/material";
import Link from "next/link";
import { FileUpload } from "../admin/FileUpload";

interface Props { context: UserContextInterface; groupId: string;}

export const GroupFiles: React.FC<Props> = (props) => {
  const [pendingFileSave, setPendingFileSave] = useState(false);
  const [files, setFiles] = useState<FileInterface[]>(null);

  let usedSpace = 0;
  files?.forEach(f => usedSpace += f.size);

  const handleFileSaved = (file: FileInterface) => {
    setPendingFileSave(false);
    loadData();
  };

  const handleSave = () => {
    setPendingFileSave(true);
  }

  const loadData = () => {
    ApiHelper.get("/files/group/" + props.groupId, "ContentApi").then(d => setFiles(d));
  }

  const handleDelete = async (file:FileInterface) => {
    if (confirm("Are you sure you wish to delete '" + file.fileName + "'?"))
    {
      await ApiHelper.delete("/files/" + file.id, "ContentApi");
      loadData();
    }
  }

  const formatSize = (bytes:number) => {
    let result = bytes.toString() + "b";
    if (bytes > 1000000) result = (Math.round(bytes / 10000) / 100).toString() + "MB";
    else if (bytes > 1000) result = (Math.round(bytes / 10) / 100).toString() + "KB";
    return result;
  }

  const getStorage = () => {

    const percent = usedSpace / 100000000;
    return (
      <>
        <div>Used space: { formatSize(usedSpace) } / 100MB</div>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: '100%', mr: 1 }}>
            <LinearProgress variant="determinate" value={percent} />
          </Box>
          <Box sx={{ minWidth: 35 }}>
            <Typography variant="body2" color="text.secondary">{`${Math.round(
              percent,
            )}%`}</Typography>
          </Box>
        </Box>
      </>
    );
  }


  useEffect(() => {
    loadData();
  }, [props.groupId]);


  let isLeader = false;
  UserHelper.currentUserChurch.groups?.forEach((g) => {
    if (g.id === props.groupId && g.leader) isLeader = true;
  });

  const fileRows = files?.map((file) => (
    <TableRow key={file.id}>
      <TableCell>
        <Link href={file.contentPath} target="_blank">{file.fileName}</Link>
      </TableCell>
      <TableCell>
        {formatSize(file.size)}
      </TableCell>
      <TableCell align="right">
        {isLeader && <SmallButton icon="delete" onClick={() => { handleDelete(file) }} /> }
      </TableCell>
    </TableRow>
  ));


  return (<>
    <DisplayBox headerText="Files" headerIcon="description">
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

    {isLeader && <InputBox headerIcon="description" headerText="Upload" saveFunction={handleSave} saveText="Upload">
      { getStorage() }
      <p>100 MB of storage space is provided for free for storing PDFs and other documents commonly needed.  We suggest using Google Drive or Dropbox to store files if additional space is needed.</p>
      { (usedSpace < 100000000) && <FileUpload contentType="group" contentId={props.groupId} pendingSave={pendingFileSave} saveCallback={handleFileSaved} /> }
    </InputBox>}
  </>);
}

