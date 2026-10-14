"use client";

import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileHelper } from "@churchapps/helpers";
import { Box, Button, IconButton, LinearProgress, Skeleton, TextField, Typography } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import LinkIcon from "@mui/icons-material/Link";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import { mobileTheme } from "../mobileTheme";
import { PlateSection, QuietEmpty, RowList, Sheet, TextLink } from "../kit";

export interface FileRow {
  id?: string;
  fileName?: string;
  size?: number;
  contentPath?: string;
  contentType?: string;
}

export interface LinkRow {
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

const tc = mobileTheme.colors;
const STORAGE_CAP = 100_000_000;
export const isHttpUrl = (url?: string) => !!url && /^https?:\/\//i.test(url);

export const formatSize = (bytes: number) => {
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

// Opens in a new tab; the delete button sits beside the link, not inside it.
export const ResourceRow = ({ href, icon, title, subtitle, trailing }: { href?: string; icon: React.ReactNode; title: React.ReactNode; subtitle?: React.ReactNode; trailing?: React.ReactNode }) => (
  <Box className="kit-row" sx={{ display: "flex", alignItems: "center", gap: "12px", minHeight: 56, py: "8px" }}>
    <Box
      component={href ? "a" : "div"}
      href={href}
      target={href ? "_blank" : undefined}
      rel={href ? "noopener noreferrer" : undefined}
      sx={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", color: "inherit" }}
    >
      {icon}
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 15, lineHeight: "21px", fontWeight: 500, color: tc.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</Typography>
        {subtitle && <Typography sx={{ fontSize: 13.5, lineHeight: "19px", color: tc.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subtitle}</Typography>}
      </Box>
    </Box>
    {trailing}
  </Box>
);

// Shared by the plate teaser and the resources slice.
export const useGroupResources = (groupId: string) => useQuery<{ files: FileRow[]; links: LinkRow[] }>({
  queryKey: ["group-resources", groupId],
  queryFn: async () => {
    let files: FileRow[] = [];
    let links: LinkRow[] = [];
    try {
      const f = await ApiHelper.get(`/files/group/${groupId}`, "ContentApi");
      files = Array.isArray(f) ? f : [];
    } catch { /* empty list */ }
    try {
      const l = await ApiHelper.get("/links?category=groupLink", "ContentApi");
      links = Array.isArray(l) ? l.filter((x: LinkRow) => x.linkData === groupId) : [];
    } catch { /* empty list */ }
    return { files, links };
  },
  enabled: !!groupId
});

export const GroupResourcesTab = ({ groupId, canEdit }: Props) => {
  const queryClient = useQueryClient();
  const { data } = useGroupResources(groupId);
  const files = data?.files ?? null;
  const links = data?.links ?? null;
  const { data: storageStatus = null } = useQuery<{ provider?: string; quotaBytes?: number } | null>({
    queryKey: ["storage-status"],
    queryFn: async () => {
      try { return await ApiHelper.get("/storage/status", "ContentApi"); } catch { return null; }
    }
  });
  const [showAddLink, setShowAddLink] = React.useState(false);
  const [linkText, setLinkText] = React.useState("");
  const [linkUrl, setLinkUrl] = React.useState("");
  const [linkSaving, setLinkSaving] = React.useState(false);
  const [linkError, setLinkError] = React.useState<string | null>(null);
  const [pendingFile, setPendingFile] = React.useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState<number>(-1);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<{ kind: "file" | "link"; id: string; name: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const load = () => queryClient.invalidateQueries({ queryKey: ["group-resources", groupId] });

  const handleConfirmDelete = async () => {
    const target = pendingDelete;
    setPendingDelete(null);
    if (!target) return;
    try {
      await ApiHelper.delete(`/${target.kind === "file" ? "files" : "links"}/${target.id}`, "ContentApi");
      load();
    } catch {

    }
  };

  const closeAddLink = () => {
    setShowAddLink(false);
    setLinkError(null);
    setLinkText("");
    setLinkUrl("");
  };

  const handleAddLink = async () => {
    setLinkError(null);
    if (!linkText.trim()) {
      setLinkError(Locale.label("mobile.group.enterLinkText"));
      return;
    }
    if (!linkUrl.trim()) {
      setLinkError(Locale.label("mobile.group.enterUrl"));
      return;
    }
    let url = linkUrl.trim();
    if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) url = "https://" + url;
    if (!isHttpUrl(url)) {
      setLinkError(Locale.label("mobile.group.invalidUrl"));
      return;
    }
    setLinkSaving(true);
    try {
      const payload = { category: "groupLink", url, linkType: "url", text: linkText.trim(), linkData: groupId, icon: "" };
      await ApiHelper.post("/links", [payload], "ContentApi");
      closeAddLink();
      load();
    } catch (e: any) {
      setLinkError(e?.message || Locale.label("mobile.group.failedAddLink"));
    } finally {
      setLinkSaving(false);
    }
  };

  const doUpload = async (file: File) => {
    setUploadError(null);
    setUploadProgress(0);
    try {
      const params = { fileName: file.name, contentType: "group", contentId: groupId, size: file.size, mimeType: file.type };
      let presigned: PresignedResponse | null = null;
      try {
        presigned = await ApiHelper.post("/files/postUrl", params, "ContentApi");
      } catch {
        presigned = null;
      }
      const record: any = { fileName: file.name, fileType: file.type, size: file.size, contentType: "group", contentId: groupId };
      if (presigned && presigned.key) {
        const uploaded = await FileHelper.uploadPresignedFile(presigned, file, setUploadProgress);
        if (uploaded.externalId) record.externalId = uploaded.externalId;
      } else {
        record.fileContents = await convertBase64(file);
      }
      await ApiHelper.post("/files", [record], "ContentApi");
      setPendingFile(null);
      setUploadProgress(-1);
      if (fileInputRef.current) fileInputRef.current.value = "";
      load();
    } catch (e: any) {
      setUploadError(e?.message || Locale.label("mobile.group.uploadFailed"));
      setUploadProgress(-1);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPendingFile(f);
    doUpload(f);
  };

  const used = (files || []).reduce((s, f) => s + (f.size || 0), 0);
  // churches with linked external storage have no 100MB cap
  const unlimited = !!storageStatus?.provider && storageStatus.provider !== "churchapps" && !storageStatus.quotaBytes;
  const percent = unlimited ? 0 : Math.min(100, (used / STORAGE_CAP) * 100);
  const storageFull = !unlimited && used >= STORAGE_CAP;

  const deleteButton = (label: string, onClick: () => void) => (
    <IconButton aria-label={label} onClick={onClick} sx={{ color: tc.textSecondary }}><DeleteOutlineIcon /></IconButton>
  );

  const skeleton = <Box>{[0, 1].map((i) => <Skeleton key={i} variant="rounded" height={48} sx={{ mb: "8px" }} />)}</Box>;

  return (
    <>
      <PlateSection
        title={Locale.label("mobile.group.links")}
        action={canEdit && <TextLink onClick={() => setShowAddLink(true)}>{Locale.label("mobile.group.addLink")}</TextLink>}
      >
        {links === null && skeleton}
        {links !== null && links.length === 0 && <QuietEmpty>{Locale.label("mobile.group.noLinks")}</QuietEmpty>}
        {links !== null && links.length > 0 && (
          <RowList>
            {links.map((l) => (
              <ResourceRow
                key={l.id}
                href={isHttpUrl(l.url) ? l.url : undefined}
                icon={<LinkIcon sx={{ color: tc.textSecondary }} />}
                title={l.text || Locale.label("mobile.group.linkFallback")}
                subtitle={l.url}
                trailing={canEdit && deleteButton(Locale.label("mobile.group.deleteLink"), () => l.id && setPendingDelete({ kind: "link", id: l.id, name: l.text || Locale.label("mobile.group.linkFallback") }))}
              />
            ))}
          </RowList>
        )}
      </PlateSection>

      <PlateSection
        title={Locale.label("mobile.group.files")}
        action={canEdit && !storageFull && (
          <TextLink onClick={() => fileInputRef.current?.click()} disabled={uploadProgress >= 0}>{Locale.label("mobile.group.upload")}</TextLink>
        )}
      >
        <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileChange} />
        {uploadProgress >= 0 && (
          <Box sx={{ mb: "10px" }}>
            <Typography sx={{ fontSize: 13.5, color: tc.textSecondary, mb: "4px" }}>
              {Locale.label("mobile.group.uploadingProgress").replace("{}", pendingFile?.name || "").replace("{}", String(uploadProgress))}
            </Typography>
            <LinearProgress variant="determinate" value={uploadProgress} sx={{ height: 6, borderRadius: 3, bgcolor: tc.border, "& .MuiLinearProgress-bar": { bgcolor: tc.primary, borderRadius: 3 } }} />
          </Box>
        )}
        {uploadError && <Typography sx={{ color: tc.error, fontSize: 13.5, mb: "8px" }}>{uploadError}</Typography>}
        {files === null && skeleton}
        {files !== null && files.length === 0 && <QuietEmpty>{Locale.label("mobile.group.noFiles")}</QuietEmpty>}
        {files !== null && files.length > 0 && (
          <RowList>
            {files.map((f) => (
              <ResourceRow
                key={f.id}
                href={f.contentPath || undefined}
                icon={<DescriptionOutlinedIcon sx={{ color: tc.textSecondary }} />}
                title={f.fileName || Locale.label("mobile.group.fileFallback")}
                subtitle={formatSize(f.size || 0)}
                trailing={canEdit && deleteButton(Locale.label("mobile.group.deleteFile"), () => f.id && setPendingDelete({ kind: "file", id: f.id, name: f.fileName || Locale.label("mobile.group.fileFallback") }))}
              />
            ))}
          </RowList>
        )}
        {files !== null && (
          <Box sx={{ mt: "14px" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: unlimited ? 0 : "6px" }}>
              <Typography sx={{ fontSize: 13.5, color: tc.textSecondary }}>
                {unlimited
                  ? Locale.label("mobile.group.usedStorageUnlimited", "Used {}").replace("{}", formatSize(used))
                  : Locale.label("mobile.group.usedStorage").replace("{}", formatSize(used))}
              </Typography>
              {!unlimited && <Typography sx={{ fontSize: 13.5, color: tc.textSecondary }}>{Math.round(percent)}%</Typography>}
            </Box>
            {!unlimited && (
              <LinearProgress variant="determinate" value={percent} sx={{ height: 6, borderRadius: 3, bgcolor: tc.border, "& .MuiLinearProgress-bar": { bgcolor: tc.primary, borderRadius: 3 } }} />
            )}
          </Box>
        )}
      </PlateSection>

      <Sheet
        open={showAddLink && canEdit}
        onClose={closeAddLink}
        title={Locale.label("mobile.group.addLink")}
        actions={(
          <>
            <Button variant="outlined" onClick={closeAddLink}>{Locale.label("mobile.group.cancel")}</Button>
            <Button variant="contained" disabled={linkSaving} onClick={handleAddLink}>
              {linkSaving ? Locale.label("mobile.group.saving") : Locale.label("mobile.group.add")}
            </Button>
          </>
        )}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: "12px", pt: "6px" }}>
          <TextField label={Locale.label("mobile.group.linkText")} value={linkText} onChange={(e) => setLinkText(e.target.value)} fullWidth autoFocus />
          <TextField label={Locale.label("mobile.group.url")} value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" fullWidth />
          {linkError && <Typography sx={{ color: tc.error, fontSize: 13.5 }}>{linkError}</Typography>}
        </Box>
      </Sheet>

      <Sheet
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title={Locale.label("mobile.group.deleteResourceTitle")}
        maxWidth="xs"
        actions={(
          <>
            <Button variant="outlined" onClick={() => setPendingDelete(null)}>{Locale.label("mobile.group.cancel")}</Button>
            <Button variant="contained" color="error" onClick={handleConfirmDelete} data-testid="confirm-delete-resource">{Locale.label("mobile.group.delete")}</Button>
          </>
        )}
      >
        <Typography sx={{ color: tc.textSecondary }}>{Locale.label("mobile.group.deleteResourceConfirm").replace("{}", pendingDelete?.name || "")}</Typography>
      </Sheet>
    </>
  );
};

export default GroupResourcesTab;
