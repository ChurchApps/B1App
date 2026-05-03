"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Icon,
  IconButton,
  Tab,
  Tabs,
  Toolbar,
  Typography,
  useMediaQuery
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme } from "@mui/material/styles";
import type { InstructionItem, Instructions } from "@churchapps/content-providers";
import { Locale } from "@churchapps/apphelper";
import { MarkdownPreviewLight } from "@churchapps/apphelper/markdown";
import { PlanHelper } from "@/helpers";
import { ContentRenderer } from "./ContentRenderer";

interface Props {
  instructions: Instructions;
  lessonName?: string;
  open: boolean;
  onClose: () => void;
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

const sectionDomId = (item: InstructionItem, fallbackKey: string) => `teach-section-${item.id || fallbackKey}`;

export const ExpandedLessonView: React.FC<Props> = ({ instructions, lessonName, open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [media, setMedia] = useState<MediaState | null>(null);
  const [activeSection, setActiveSection] = useState<string>("");
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const sectionList = useMemo(() => {
    const result: { item: InstructionItem; domId: string }[] = [];
    const walk = (items: InstructionItem[], path: string) => {
      items.forEach((item, idx) => {
        const itemType = item.itemType || "";
        const fallbackKey = `${path}-${idx}`;
        if (SECTION_TYPES.has(itemType)) {
          result.push({ item, domId: sectionDomId(item, fallbackKey) });
        } else if (item.children?.length) {
          walk(item.children, fallbackKey);
        }
      });
    };
    walk(instructions.items, "root");
    return result;
  }, [instructions.items]);

  useEffect(() => {
    if (!open) return;
    if (sectionList.length > 0) {
      setActiveSection(sectionList[0].domId);
    } else {
      setActiveSection("");
    }
  }, [open, sectionList]);

  const handleTabChange = (_: any, value: string) => {
    setActiveSection(value);
    const container = scrollContainerRef.current;
    const target = document.getElementById(value);
    if (container && target) {
      const offset = target.offsetTop - 8;
      container.scrollTo({ top: offset, behavior: "smooth" });
    }
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container || sectionList.length === 0) return;
    const scrollPos = container.scrollTop + 24;
    let current = sectionList[0].domId;
    for (const { domId } of sectionList) {
      const el = document.getElementById(domId);
      if (!el) continue;
      if (el.offsetTop <= scrollPos) current = domId;
      else break;
    }
    if (current !== activeSection) setActiveSection(current);
  };

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

  const renderSection = (item: InstructionItem, key: string, domId: string) => (
    <Box key={key} id={domId} sx={{ scrollMarginTop: 8, mb: 3 }}>
      {item.children?.map((child, idx) => renderAction(child, `${key}-${child.id || idx}`))}
    </Box>
  );

  const renderTopLevel = (item: InstructionItem, key: string, sectionMap: Map<InstructionItem, string>): React.ReactNode => {
    const itemType = item.itemType || "";

    if (SECTION_TYPES.has(itemType)) {
      const domId = sectionMap.get(item) || sectionDomId(item, key);
      return renderSection(item, key, domId);
    }

    if (itemType === "header") {
      return (
        <Box key={key}>
          {item.children?.map((child, idx) => renderTopLevel(child, `${key}-${child.id || idx}`, sectionMap))}
        </Box>
      );
    }

    if (ACTION_TYPES.has(itemType) || FILE_TYPES.has(itemType)) {
      return renderAction(item, key);
    }

    if (item.children?.length) {
      return (
        <Box key={key}>
          {item.children.map((child, idx) => renderTopLevel(child, `${key}-${child.id || idx}`, sectionMap))}
        </Box>
      );
    }

    return renderAction(item, key);
  };

  const sectionDomMap = useMemo(() => {
    const map = new Map<InstructionItem, string>();
    sectionList.forEach(({ item, domId }) => map.set(item, domId));
    return map;
  }, [sectionList]);

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDialog-paper": {
          backgroundColor: "#ffffff",
          color: "#212121",
          margin: 0,
          maxWidth: "100vw",
          width: "100vw",
          colorScheme: "light"
        }
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: "#28235d",
          zIndex: (t) => t.zIndex.drawer + 1
        }}
      >
        <Toolbar variant="dense" sx={{ minHeight: isMobile ? 48 : 56, px: { xs: 1, sm: 2 } }}>
          <Typography sx={{ flex: 1, color: "#fff", fontWeight: 600, fontSize: isMobile ? 14 : 16 }} noWrap>
            {lessonName || ""}
          </Typography>
          <IconButton edge="end" onClick={onClose} aria-label={Locale.label("mobile.plans.close")} sx={{ color: "#fff" }}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
        {sectionList.length > 0 && (
          <Tabs
            value={activeSection || sectionList[0].domId}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              minHeight: isMobile ? 36 : 42,
              backgroundColor: "#28235d",
              "& .MuiTab-root": {
                minHeight: isMobile ? 36 : 42,
                textTransform: "none",
                fontSize: isMobile ? "0.8125rem" : "0.875rem",
                color: "#fff",
                opacity: 0.85,
                px: isMobile ? 1.5 : 2,
                "&.Mui-selected": { backgroundColor: "#fff", color: "#1c75bc", opacity: 1, fontWeight: 700 }
              },
              "& .MuiTabs-indicator": { display: "none" },
              "& .MuiTabs-scrollButtons": { color: "#fff", "&.Mui-disabled": { opacity: 0.3 } }
            }}
          >
            {sectionList.map(({ item, domId }, idx) => (
              <Tab key={domId} value={domId} label={item.label || `Section ${idx + 1}`} />
            ))}
          </Tabs>
        )}
      </AppBar>

      <Box
        ref={scrollContainerRef}
        onScroll={handleScroll}
        sx={{
          flex: 1,
          overflowY: "auto",
          backgroundColor: "#ffffff",
          color: "#212121",
          px: { xs: 1, sm: 2 },
          py: { xs: 1.5, sm: 2 },
          "& .MuiTypography-root": { color: "inherit" },
          "& a": { color: "#1d6fb8" }
        }}
      >
        {instructions.items.map((item, idx) => renderTopLevel(item, `top-${item.id || idx}`, sectionDomMap))}
      </Box>

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
    </Dialog>
  );
};
