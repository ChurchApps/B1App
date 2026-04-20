"use client";

import React from "react";
import axios, { type AxiosProgressEvent } from "axios";
import {
  Box,
  Button,
  Collapse,
  Icon,
  IconButton,
  LinearProgress,
  Skeleton,
  TextField,
  Typography
} from "@mui/material";
import { ApiHelper } from "@churchapps/apphelper";
import { mobileTheme } from "../mobileTheme";

interface FileRow {
  id?: string;
  fileName?: string;
  size?: number;
  contentPath?: string;
  contentType?: string;
}

interface LinkRow {
  id?: string;
  text?: string;
  url?: string;
  category?: string;
  linkData?: string;
}

interface Props {
  groupId: string;
  canEdit: boolean;
}

const STORAGE_CAP = 100_000_000; // 100 MB

const formatSize = (bytes: number) => {
  if (bytes > 1_000_000) return `${(Math.round(bytes / 10_000) / 100).toFixed(2)}MB`;
  if (bytes > 1000) return `${(Math.round(bytes / 10) / 100).toFixed(2)}KB`;
  return `${bytes}b`;
};

const convertBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
  });

interface PresignedResponse {
  url: string;
  key?: string;
  fields: Record<string, string>;
}

export const GroupResourcesTab = ({ groupId, canEdit }: Props) => {
  const tc = mobileTheme.colors;
  const [files, setFiles] = React.useState<FileRow[] | null>(null);
  const [links, setLinks] = React.useState<LinkRow[] | null>(null);
  const [showAddLink, setShowAddLink] = React.useState(false);
  const [linkText, setLinkText] = React.useState("");
  const [linkUrl, setLinkUrl] = React.useState("");
  const [linkSaving, setLinkSaving] = React.useState(false);
  const [linkError, setLinkError] = React.useState<string | null>(null);
  const [pendingFile, setPendingFile] = React.useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState<number>(-1);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const load = React.useCallback(async () => {
    setFiles(null);
    setLinks(null);
    try {
      const f: FileRow[] = await ApiHelper.get(`/files/group/${groupId}`, "ContentApi");
      setFiles(Array.isArray(f) ? f : []);
    } catch {
      setFiles([]);
    }
    try {
      const l: LinkRow[] = await ApiHelper.get("/links?category=groupLink", "ContentApi");
      const matches = Array.isArray(l) ? l.filter((x) => x.linkData === groupId) : [];
      setLinks(matches);
    } catch {
      setLinks([]);
    }
  }, [groupId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleDeleteFile = async (f: FileRow) => {
    if (!f.id) return;
    if (!window.confirm(`Delete ${f.fileName || "file"}?`)) return;
    try {
      await ApiHelper.delete(`/files/${f.id}`, "ContentApi");
      load();
    } catch {
      /* ignore */
    }
  };

  const handleDeleteLink = async (l: LinkRow) => {
    if (!l.id) return;
    if (!window.confirm(`Delete link "${l.text || "Link"}"?`)) return;
    try {
      await ApiHelper.delete(`/links/${l.id}`, "ContentApi");
      load();
    } catch {
      /* ignore */
    }
  };

  const handleAddLink = async () => {
    setLinkError(null);
    if (!linkText.trim()) {
      setLinkError("Please enter link text.");
      return;
    }
    if (!linkUrl.trim()) {
      setLinkError("Please enter a URL.");
      return;
    }
    setLinkSaving(true);
    try {
      const payload = {
        category: "groupLink",
        url: linkUrl.trim(),
        linkType: "url",
        text: linkText.trim(),
        linkData: groupId,
        icon: ""
      };
      await ApiHelper.post("/links", [payload], "ContentApi");
      setLinkText("");
      setLinkUrl("");
      setShowAddLink(false);
      load();
    } catch (e: any) {
      setLinkError(e?.message || "Failed to add link.");
    } finally {
      setLinkSaving(false);
    }
  };

  const postPresigned = async (presigned: PresignedResponse, file: File) => {
    const formData = new FormData();
    formData.append("acl", "public-read");
    formData.append("Content-Type", file.type);
    for (const prop in presigned.fields) formData.append(prop, presigned.fields[prop]);
    formData.append("file", file);
    await axios.post(presigned.url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (evt: AxiosProgressEvent) => {
        if (evt.total) {
          setUploadProgress(Math.round((100 * evt.loaded) / evt.total));
        }
      }
    });
  };

  const doUpload = async (file: File) => {
    setUploadError(null);
    setUploadProgress(0);
    try {
      const params = { fileName: file.name, contentType: "group", contentId: groupId };
      let presigned: PresignedResponse | null = null;
      try {
        presigned = await ApiHelper.post("/files/postUrl", params, "ContentApi");
      } catch {
        presigned = null;
      }
      const record: any = {
        fileName: file.name,
        fileType: file.type,
        size: file.size,
        contentType: "group",
        contentId: groupId
      };
      if (presigned && presigned.key) {
        await postPresigned(presigned, file);
      } else {
        const base64 = await convertBase64(file);
        record.fileContents = base64;
      }
      await ApiHelper.post("/files", [record], "ContentApi");
      setPendingFile(null);
      setUploadProgress(-1);
      if (fileInputRef.current) fileInputRef.current.value = "";
      load();
    } catch (e: any) {
      setUploadError(e?.message || "Upload failed.");
      setUploadProgress(-1);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPendingFile(f);
    doUpload(f);
  };

  const used = (files || []).reduce((s, f) => s + (f.size || 0), 0);
  const percent = Math.min(100, (used / STORAGE_CAP) * 100);
  const storageFull = used >= STORAGE_CAP;

  const renderFileRow = (f: FileRow) => {
    const href = f.contentPath
      ? f.contentPath.startsWith("http")
        ? f.contentPath
        : f.contentPath
      : undefined;
    return (
      <Box
        key={f.id}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: `${mobileTheme.spacing.sm}px`,
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "20px",
            bgcolor: tc.iconBackground,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}
        >
          <Icon sx={{ color: tc.primary }}>description</Icon>
        </Box>
        <Box
          component={href ? "a" : "div"}
          href={href}
          target={href ? "_blank" : undefined}
          rel={href ? "noopener noreferrer" : undefined}
          sx={{
            flex: 1,
            minWidth: 0,
            textDecoration: "none",
            color: "inherit"
          }}
        >
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 600,
              color: tc.text,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            {f.fileName || "File"}
          </Typography>
          <Typography sx={{ fontSize: 12, color: tc.textSecondary }}>{formatSize(f.size || 0)}</Typography>
        </Box>
        {canEdit && (
          <IconButton aria-label="Delete file" onClick={() => handleDeleteFile(f)} sx={{ color: tc.error }}>
            <Icon>delete_outline</Icon>
          </IconButton>
        )}
      </Box>
    );
  };

  const renderLinkRow = (l: LinkRow) => (
    <Box
      key={l.id}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: `${mobileTheme.spacing.sm}px`,
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.lg}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.md}px`
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: "20px",
          bgcolor: tc.iconBackground,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        }}
      >
        <Icon sx={{ color: tc.primary }}>link</Icon>
      </Box>
      <Box
        component="a"
        href={l.url}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ flex: 1, minWidth: 0, textDecoration: "none", color: "inherit" }}
      >
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 600,
            color: tc.text,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
        >
          {l.text || "Link"}
        </Typography>
        <Typography
          sx={{
            fontSize: 12,
            color: tc.textSecondary,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
        >
          {l.url}
        </Typography>
      </Box>
      {canEdit && (
        <IconButton aria-label="Delete link" onClick={() => handleDeleteLink(l)} sx={{ color: tc.error }}>
          <Icon>delete_outline</Icon>
        </IconButton>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.md}px` }}>
      {/* Links */}
      <Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: `${mobileTheme.spacing.sm}px`
          }}
        >
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: tc.text }}>Links</Typography>
          {canEdit && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<Icon>add_link</Icon>}
              onClick={() => setShowAddLink((v) => !v)}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderColor: tc.primary,
                color: tc.primary,
                borderRadius: `${mobileTheme.radius.md}px`
              }}
            >
              {showAddLink ? "Cancel" : "Add Link"}
            </Button>
          )}
        </Box>

        {canEdit && (
          <Collapse in={showAddLink} unmountOnExit>
            <Box
              sx={{
                bgcolor: tc.surface,
                borderRadius: `${mobileTheme.radius.lg}px`,
                boxShadow: mobileTheme.shadows.sm,
                p: `${mobileTheme.spacing.md}px`,
                mb: 1,
                display: "flex",
                flexDirection: "column",
                gap: 1
              }}
            >
              <TextField
                size="small"
                label="Link text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                fullWidth
              />
              <TextField
                size="small"
                label="URL"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://…"
                fullWidth
              />
              {linkError && (
                <Typography sx={{ color: tc.error, fontSize: 12 }}>{linkError}</Typography>
              )}
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                <Button
                  size="small"
                  onClick={() => {
                    setShowAddLink(false);
                    setLinkError(null);
                    setLinkText("");
                    setLinkUrl("");
                  }}
                  sx={{ textTransform: "none", color: tc.text }}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  disabled={linkSaving}
                  onClick={handleAddLink}
                  sx={{
                    bgcolor: tc.primary,
                    color: tc.onPrimary,
                    textTransform: "none",
                    fontWeight: 600,
                    "&:hover": { bgcolor: tc.primary }
                  }}
                >
                  {linkSaving ? "Saving…" : "Add"}
                </Button>
              </Box>
            </Box>
          </Collapse>
        )}

        {links === null && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {[0, 1].map((i) => (
              <Skeleton
                key={`ls-${i}`}
                variant="rounded"
                height={64}
                sx={{ borderRadius: `${mobileTheme.radius.lg}px` }}
              />
            ))}
          </Box>
        )}
        {links !== null && links.length === 0 && (
          <Box
            sx={{
              bgcolor: tc.surface,
              borderRadius: `${mobileTheme.radius.lg}px`,
              p: `${mobileTheme.spacing.md}px`,
              textAlign: "center"
            }}
          >
            <Typography sx={{ fontSize: 13, color: tc.textMuted }}>No links yet.</Typography>
          </Box>
        )}
        {links !== null && links.length > 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>{links.map(renderLinkRow)}</Box>
        )}
      </Box>

      {/* Files */}
      <Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: `${mobileTheme.spacing.sm}px`
          }}
        >
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: tc.text }}>Files</Typography>
          {canEdit && !storageFull && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<Icon>upload_file</Icon>}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadProgress >= 0}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderColor: tc.primary,
                color: tc.primary,
                borderRadius: `${mobileTheme.radius.md}px`
              }}
            >
              Upload
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </Box>
        {uploadProgress >= 0 && (
          <Box sx={{ mb: 1 }}>
            <Typography sx={{ fontSize: 12, color: tc.textSecondary, mb: 0.5 }}>
              Uploading {pendingFile?.name}… {uploadProgress}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={uploadProgress}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: tc.border,
                "& .MuiLinearProgress-bar": { bgcolor: tc.primary, borderRadius: 3 }
              }}
            />
          </Box>
        )}
        {uploadError && (
          <Typography sx={{ color: tc.error, fontSize: 12, mb: 1 }}>{uploadError}</Typography>
        )}

        {files === null && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {[0, 1].map((i) => (
              <Skeleton
                key={`fs-${i}`}
                variant="rounded"
                height={64}
                sx={{ borderRadius: `${mobileTheme.radius.lg}px` }}
              />
            ))}
          </Box>
        )}
        {files !== null && files.length === 0 && (
          <Box
            sx={{
              bgcolor: tc.surface,
              borderRadius: `${mobileTheme.radius.lg}px`,
              p: `${mobileTheme.spacing.md}px`,
              textAlign: "center"
            }}
          >
            <Typography sx={{ fontSize: 13, color: tc.textMuted }}>No files yet.</Typography>
          </Box>
        )}
        {files !== null && files.length > 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>{files.map(renderFileRow)}</Box>
        )}
      </Box>

      {/* Storage usage */}
      {files !== null && (
        <Box
          sx={{
            bgcolor: tc.surface,
            borderRadius: `${mobileTheme.radius.lg}px`,
            p: `${mobileTheme.spacing.md}px`
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 1 }}>
            <Typography sx={{ fontSize: 13, color: tc.textMuted }}>
              Used {formatSize(used)} / 100MB
            </Typography>
            <Typography sx={{ fontSize: 12, color: tc.textSecondary }}>
              {Math.round(percent)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={percent}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: tc.border,
              "& .MuiLinearProgress-bar": { bgcolor: tc.primary, borderRadius: 4 }
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default GroupResourcesTab;
