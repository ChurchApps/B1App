"use client";
import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Icon,
  Typography
} from "@mui/material";
import type { InstructionItem, Instructions } from "@churchapps/content-providers";
import { Locale } from "@churchapps/apphelper";
import { MarkdownPreviewLight } from "@churchapps/apphelper/markdown";
import { PlanHelper } from "@/helpers";
import { ContentRenderer } from "./ContentRenderer";

interface Props {
  instructions: Instructions;
  lessonName?: string;
}

interface MediaState {
  url?: string;
  mediaType?: "video" | "image" | "text" | "iframe";
  label?: string;
  description?: string;
}

const SECTION_TYPES = new Set(["section", "lessonSection", "providerSection", "item"]);
const ACTION_TYPES = new Set(["action", "lessonAction", "providerPresentation"]);
const FILE_TYPES = new Set(["file", "providerFile", "addon", "lessonAddOn"]);

const getDisplayText = (item: InstructionItem): string =>
  (item.content && item.content.trim()) || item.label || "";

const findDownloadable = (item: InstructionItem): { url?: string; mediaType?: "video" | "image"; thumbnail?: string } => {
  if (item.downloadUrl) return { url: item.downloadUrl, mediaType: item.mediaType, thumbnail: item.thumbnail };
  if (item.children?.length) {
    for (const child of item.children) {
      if (child.downloadUrl) return { url: child.downloadUrl, mediaType: child.mediaType, thumbnail: child.thumbnail || item.thumbnail };
    }
  }
  return {};
};

export const ExpandedLessonView: React.FC<Props> = ({ instructions, lessonName }) => {
  const [media, setMedia] = useState<MediaState | null>(null);

  const openMedia = (item: InstructionItem) => {
    const { url, mediaType } = findDownloadable(item);
    if (!url && !item.content) return;
    setMedia({
      url,
      mediaType,
      label: item.label,
      description: item.content
    });
  };

  const renderPlay = (item: InstructionItem, key: string) => {
    const { url, thumbnail } = findDownloadable(item);
    const title = item.label || getDisplayText(item) || "";
    let thumb = thumbnail || item.thumbnail || "";
    if (thumb && (thumb.indexOf(".mp4") > -1 || thumb.indexOf(".webm") > -1)) thumb = "";
    const seconds = item.seconds || 0;
    const clickable = !!url || !!item.content;

    return (
      <Box
        key={key}
        onClick={clickable ? () => openMedia(item) : undefined}
        sx={{
          display: "flex",
          alignItems: "center",
          height: 72,
          border: "1px solid #ccc",
          borderRadius: "10px",
          backgroundColor: "#fff",
          mb: 2.5,
          mt: 2.5,
          overflow: "hidden",
          cursor: clickable ? "pointer" : "default",
          transition: "box-shadow 0.15s",
          "&:hover": clickable ? { boxShadow: "0 2px 6px rgba(0,0,0,0.12)" } : undefined
        }}
      >
        {thumb ? (
          <Box
            component="img"
            src={thumb}
            alt={title}
            sx={{
              width: 128,
              height: 72,
              objectFit: "cover",
              borderTopLeftRadius: "10px",
              borderBottomLeftRadius: "10px",
              flexShrink: 0
            }}
          />
        ) : (
          <Box
            sx={{
              width: 128,
              height: 72,
              borderTopLeftRadius: "10px",
              borderBottomLeftRadius: "10px",
              backgroundColor: "#eff8fd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            <Icon sx={{ color: "#1d6fb8", fontSize: 32 }}>play_circle</Icon>
          </Box>
        )}
        <Box sx={{ flex: 1, px: 2.5, fontWeight: 700, fontSize: 18, color: "#1d6fb8" }}>
          {title}
        </Box>
        {seconds > 0 && (
          <Box sx={{ pr: 2.5, fontSize: 14, color: "#666", whiteSpace: "nowrap" }}>
            {PlanHelper.formatTime(seconds)}
          </Box>
        )}
      </Box>
    );
  };

  const renderAction = (item: InstructionItem, key: string): React.ReactNode => {
    const actionType = (item.actionType || "").toLowerCase();
    const text = getDisplayText(item);

    if (actionType === "play" || (FILE_TYPES.has(item.itemType || "") && findDownloadable(item).url)) {
      return renderPlay(item, key);
    }

    if (actionType === "note") {
      return (
        <Box
          key={key}
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1.5,
            p: 2,
            mb: 2,
            backgroundColor: "#fffbe6",
            borderLeft: "4px solid #f5c518",
            borderRadius: "6px",
            "& p": { m: 0, mb: 1, "&:last-child": { mb: 0 } },
            "& ul, & ol": { pl: 2.5, my: 0.5 }
          }}
        >
          <Icon sx={{ color: "#b88600", fontSize: 24, mt: 0.25 }}>sticky_note_2</Icon>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <MarkdownPreviewLight value={text} />
          </Box>
        </Box>
      );
    }

    if (actionType === "do") {
      return (
        <Box
          key={key}
          sx={{
            mb: 2,
            "& p": { fontWeight: 700, fontSize: 16, m: 0, mb: 1, "&:last-child": { mb: 0 } },
            "& ul, & ol": { pl: 2.5, my: 0.5 },
            "& li": { fontSize: 16, fontWeight: 700, mb: 0.5 }
          }}
        >
          <MarkdownPreviewLight value={text} />
        </Box>
      );
    }

    if (actionType === "say") {
      return (
        <Box
          key={key}
          sx={{
            mb: 2,
            "&::after": { content: '""', display: "block", clear: "both" },
            "& p": {
              backgroundColor: "#ebf7ff",
              borderRadius: "10px",
              padding: "8px 16px",
              maxWidth: { xs: "85%", sm: "70%", md: "55%" },
              clear: "both",
              mb: 1
            },
            "& p:nth-of-type(even)": {
              backgroundColor: "#edfeff",
              float: "right"
            }
          }}
        >
          <MarkdownPreviewLight value={text} />
        </Box>
      );
    }

    if (actionType === "add-on" || actionType === "addon") {
      const { url } = findDownloadable(item);
      if (url) return renderPlay(item, key);
      return (
        <Box key={key} sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 15 }}>{text}</Typography>
        </Box>
      );
    }

    if (!text) return null;
    return (
      <Box key={key} sx={{ mb: 2 }}>
        <MarkdownPreviewLight value={text} />
      </Box>
    );
  };

  const renderSectionCard = (item: InstructionItem, key: string) => {
    const sectionDuration = item.children?.reduce((acc, c) => acc + (c.seconds || 0), 0) || 0;
    return (
      <Card key={key} sx={{ mb: 2.5, border: "1px solid #e0e0e0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <CardHeader
          sx={{
            backgroundColor: "#eff8fd",
            py: 1,
            "& .MuiCardHeader-title": {
              fontWeight: 700,
              fontSize: 20,
              color: "#1d6fb8"
            },
            "& .MuiCardHeader-action": { alignSelf: "center", mt: 0, mr: 0 }
          }}
          title={item.label}
          action={
            sectionDuration > 0 ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "#1d6fb8", fontSize: 13 }}>
                <Icon sx={{ fontSize: 16 }}>schedule</Icon>
                <span>{PlanHelper.formatTime(sectionDuration)}</span>
              </Box>
            ) : undefined
          }
        />
        <CardContent>
          {item.children?.map((child, idx) => renderAction(child, `${key}-${child.id || idx}`))}
        </CardContent>
      </Card>
    );
  };

  const renderTopLevel = (item: InstructionItem, key: string): React.ReactNode => {
    const itemType = item.itemType || "";

    if (itemType === "header") {
      return (
        <Box key={key} sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#28235d", mb: 1.5, mt: 2 }}>
            {item.label}
          </Typography>
          {item.children?.map((child, idx) => renderTopLevel(child, `${key}-${child.id || idx}`))}
        </Box>
      );
    }

    if (SECTION_TYPES.has(itemType)) {
      return renderSectionCard(item, key);
    }

    if (ACTION_TYPES.has(itemType) || FILE_TYPES.has(itemType)) {
      return renderAction(item, key);
    }

    if (item.children?.length) {
      return (
        <Box key={key}>
          {item.children.map((child, idx) => renderTopLevel(child, `${key}-${child.id || idx}`))}
        </Box>
      );
    }

    return renderAction(item, key);
  };

  return (
    <Box
      sx={{
        backgroundColor: "#ffffff",
        color: "#212121",
        borderRadius: "12px",
        p: { xs: 1.5, sm: 2.5 },
        colorScheme: "light",
        "& .MuiTypography-root": { color: "inherit" },
        "& .MuiCard-root": { backgroundColor: "#ffffff", color: "#212121" },
        "& .MuiCardContent-root": { color: "#212121" },
        "& a": { color: "#1d6fb8" }
      }}
    >
      {lessonName && (
        <Typography sx={{ fontSize: 14, color: "#5f6368", mb: 2 }}>
          Lesson: {lessonName}
        </Typography>
      )}
      {instructions.items.map((item, idx) => renderTopLevel(item, `top-${item.id || idx}`))}

      {media && (
        <Dialog open onClose={() => setMedia(null)} fullWidth maxWidth="lg">
          <DialogTitle>{media.label || ""}</DialogTitle>
          <DialogContent sx={{ p: 0, overflow: "hidden" }}>
            <ContentRenderer
              url={media.url}
              mediaType={media.mediaType}
              title={media.label}
              description={media.description}
            />
          </DialogContent>
          <DialogActions>
            <Button variant="outlined" onClick={() => setMedia(null)}>
              {Locale.label("mobile.plans.close")}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};
