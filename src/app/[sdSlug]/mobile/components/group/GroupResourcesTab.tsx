"use client";

import React from "react";
import { Box, Button, Icon, IconButton, LinearProgress, Skeleton, Typography } from "@mui/material";
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

export const GroupResourcesTab = ({ groupId, canEdit }: Props) => {
  const tc = mobileTheme.colors;
  const [files, setFiles] = React.useState<FileRow[] | null>(null);
  const [links, setLinks] = React.useState<LinkRow[] | null>(null);

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

  const used = (files || []).reduce((s, f) => s + (f.size || 0), 0);
  const percent = Math.min(100, (used / STORAGE_CAP) * 100);

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
          p: `${mobileTheme.spacing.md}px`,
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
            flexShrink: 0,
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
            color: "inherit",
          }}
        >
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 600,
              color: tc.text,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
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
        p: `${mobileTheme.spacing.md}px`,
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
          flexShrink: 0,
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
            whiteSpace: "nowrap",
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
            whiteSpace: "nowrap",
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
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: tc.text, mb: `${mobileTheme.spacing.sm}px` }}>
          Links
        </Typography>
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
              textAlign: "center",
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
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: tc.text, mb: `${mobileTheme.spacing.sm}px` }}>
          Files
        </Typography>
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
              textAlign: "center",
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
            p: `${mobileTheme.spacing.md}px`,
          }}
        >
          <Typography sx={{ fontSize: 13, color: tc.textMuted, mb: 1 }}>
            {formatSize(used)} of 100MB used
          </Typography>
          <LinearProgress
            variant="determinate"
            value={percent}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: tc.border,
              "& .MuiLinearProgress-bar": { bgcolor: tc.primary, borderRadius: 4 },
            }}
          />
        </Box>
      )}

      {canEdit && (
        <Typography sx={{ fontSize: 12, color: tc.textMuted, textAlign: "center" }}>
          Use the desktop site to upload new files or add links.
        </Typography>
      )}
    </Box>
  );
};

export default GroupResourcesTab;
