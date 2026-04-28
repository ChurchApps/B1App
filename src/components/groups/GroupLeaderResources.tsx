"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Box, Chip, Divider, LinearProgress, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { ApiHelper } from "@churchapps/apphelper";
import { DisplayBox } from "@churchapps/apphelper";
import { InputBox } from "@churchapps/apphelper";
import { Locale } from "@churchapps/apphelper";
import { SmallButton } from "@churchapps/apphelper";
import type { LinkInterface, UserContextInterface } from "@churchapps/helpers";
import { FileInterface } from "@/helpers";
import { FileUpload } from "../FileUpload";
import { GroupLinkAdd } from "./GroupLinkAdd";

interface Props {
  context: UserContextInterface;
  groupId: string;
}

export const GroupLeaderResources: React.FC<Props> = (props) => {
  const [pendingFileSave, setPendingFileSave] = useState(false);
  const [files, setFiles] = useState<FileInterface[]>(null);
  const [links, setLinks] = useState<LinkInterface[]>(null);

  let usedSpace = 0;
  files?.forEach((f) => (usedSpace += f.size));

  const handleCallback = () => {
    setPendingFileSave(false);
    loadData();
  };

  const loadData = () => {
    ApiHelper.get("/files/groupLeader/" + props.groupId, "ContentApi").then((d: FileInterface[]) => {
      setFiles(d);
    });

    ApiHelper.get("/links?category=groupLeaderLink", "ContentApi").then((data: LinkInterface[]) => {
      const result: LinkInterface[] = [];
      data?.forEach((l) => {
        if (l.linkData === props.groupId) result.push(l);
      });
      setLinks(result);
    });
  };

  const handleSave = () => {
    setPendingFileSave(true);
  };

  const handleDelete = async (file: FileInterface) => {
    if (confirm(Locale.label("groups.confirmDelete").replace("{}", file.fileName))) {
      await ApiHelper.delete("/files/" + file.id, "ContentApi");
      loadData();
    }
  };

  const handleLinkDelete = async (link: LinkInterface) => {
    if (confirm(Locale.label("groups.confirmDelete").replace("{}", link.text))) {
      await ApiHelper.delete("/links/" + link.id, "ContentApi");
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
    const percent = usedSpace / 100000000;
    return (
      <>
        <div>{Locale.label("groups.usedSpace").replace("{}", formatSize(usedSpace))}</div>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Box sx={{ width: "100%", mr: 1 }}>
            <LinearProgress variant="determinate" value={percent} />
          </Box>
          <Box sx={{ minWidth: 35 }}>
            <Typography variant="body2" color="text.secondary">
              {`${Math.round(percent)}%`}
            </Typography>
          </Box>
        </Box>
      </>
    );
  };

  useEffect(() => {
    loadData();
  }, [props.groupId]);

  const fileRows = files?.map((file) => (
    <TableRow key={file.id}>
      <TableCell>
        <Link href={file.contentPath} target="_blank" data-testid={`leader-resource-file-${file.id}-link`}>
          {file.fileName}
        </Link>
      </TableCell>
      <TableCell>{formatSize(file.size)}</TableCell>
      <TableCell align="right">
        <SmallButton
          icon="delete"
          onClick={() => {
            handleDelete(file);
          }}
          data-testid={`delete-leader-file-${file.id}`}
        />
      </TableCell>
    </TableRow>
  ));

  const linkRows = links?.map((link) => (
    <TableRow key={link.id}>
      <TableCell>
        <Link href={link.url} target="_blank" data-testid={`leader-resource-link-${link.id}-link`}>
          {link.text}
        </Link>
      </TableCell>
      <TableCell>
        <SmallButton
          icon="delete"
          onClick={() => {
            handleLinkDelete(link);
          }}
          data-testid={`delete-leader-link-${link.id}`}
        />
      </TableCell>
    </TableRow>
  ));

  return (
    <>
      <DisplayBox headerText={Locale.label("groups.files")} headerIcon="description" data-testid="group-leader-files-display-box">
        {links && links.length > 0 && (
          <>
            <Divider variant="middle" textAlign="center" sx={{ marginTop: 3, marginBottom: 3 }}>
              <Chip label={Locale.label("groups.addedLinks")} size="small" color="primary" sx={{ width: 120 }} />
            </Divider>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>{linkRows}</TableBody>
            </Table>
          </>
        )}
        {files && files?.length > 0 && (
          <>
            <Divider variant="middle" textAlign="center" sx={{ marginTop: 3, marginBottom: 3 }}>
              <Chip label={Locale.label("groups.uploadedFiles")} size="small" color="primary" sx={{ width: 120 }} />
            </Divider>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>{fileRows}</TableBody>
            </Table>
          </>
        )}
      </DisplayBox>

      {/* Link Add */}
      <GroupLinkAdd
        saveCallback={() => { loadData(); }}
        groupId={props.groupId}
        forGroupLeader
      />

      {/* File Upload */}
      <InputBox headerIcon="description" headerText={Locale.label("groups.upload")} saveFunction={handleSave} saveText={Locale.label("groups.upload")} data-testid="group-leader-upload-inputbox">
        {getStorage()}
        <p>{Locale.label("groups.storageInfo")}</p>
        {usedSpace < 100000000 && (
          <FileUpload
            contentType="groupLeader"
            contentId={props.groupId}
            pendingSave={pendingFileSave}
            saveCallback={handleCallback}
          />
        )}
      </InputBox>
    </>
  );
};
