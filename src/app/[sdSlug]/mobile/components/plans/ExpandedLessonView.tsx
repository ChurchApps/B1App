"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";
import type { InstructionItem, Instructions } from "@churchapps/content-providers";
import { Locale } from "@churchapps/apphelper";
import { MarkdownPreviewLight } from "@churchapps/apphelper/markdown";
import { PlanHelper } from "@/helpers";
import { ContentRenderer } from "./ContentRenderer";
import { mobileTheme } from "../mobileTheme";
import { PageHead, Plate, PlateSection, Sheet, TextLink } from "../kit";

const tc = mobileTheme.colors;

interface Props {
  instructions: Instructions;
  lessonName?: string;
  open: boolean;
  onClose: () => void;
}

interface MediaState {
  url?: string;
  mediaType?: "video" | "image" | "audio" | "text" | "iframe";
  label?: string;
  description?: string;
}

const SECTION_TYPES = new Set(["section", "lessonSection", "providerSection", "item"]);
const ACTION_TYPES = new Set(["action", "lessonAction", "providerPresentation"]);
const FILE_TYPES = new Set(["file", "providerFile", "addon", "lessonAddOn"]);

const getDisplayText = (item: InstructionItem): string =>
  (item.content && item.content.trim()) || item.label || "";

const findDownloadable = (item: InstructionItem): { url?: string; mediaType?: "video" | "image" | "audio"; thumbnail?: string } => {
  if (item.downloadUrl) return { url: item.downloadUrl, mediaType: item.mediaType, thumbnail: item.thumbnail };
  if (item.children?.length) {
    for (const child of item.children) {
      if (child.downloadUrl) return { url: child.downloadUrl, mediaType: child.mediaType, thumbnail: child.thumbnail || item.thumbnail };
    }
  }
  return {};
};

const sectionDomId = (item: InstructionItem, fallbackKey: string) => `teach-section-${item.id || fallbackKey}`;

const sectionSeconds = (item: InstructionItem): number =>
  item.seconds || (item.children || []).reduce((sum, c) => sum + (c.seconds || 0), 0);

const markdownSx = { "& p": { m: 0, mb: 1, "&:last-child": { mb: 0 } }, "& ul, & ol": { pl: 2.5, my: 0.5 } };

export const ExpandedLessonView: React.FC<Props> = ({ instructions, lessonName, open, onClose }) => {
  const [media, setMedia] = useState<MediaState | null>(null);
  const [activeSection, setActiveSection] = useState<string>("");
  const [showSections, setShowSections] = useState(false);
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
    setActiveSection(sectionList.length > 0 ? sectionList[0].domId : "");
  }, [open, sectionList]);

  const offsetInContainer = (container: HTMLElement, el: HTMLElement) =>
    el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;

  const goToSection = (domId: string) => {
    setActiveSection(domId);
    setShowSections(false);
    const container = scrollContainerRef.current;
    const target = document.getElementById(domId);
    if (container && target) {
      container.scrollTo({ top: offsetInContainer(container, target) - 8, behavior: "smooth" });
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
      if (offsetInContainer(container, el) <= scrollPos) current = domId;
      else break;
    }
    if (current !== activeSection) setActiveSection(current);
  };

  const openMedia = (item: InstructionItem) => {
    const { url, mediaType } = findDownloadable(item);
    if (!url && !item.content) return;
    setMedia({ url, mediaType, label: item.label, description: item.content });
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
        component={clickable ? "button" : "div"}
        type={clickable ? "button" : undefined}
        onClick={clickable ? () => openMedia(item) : undefined}
        sx={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          height: 72,
          p: 0,
          my: "16px",
          border: `1px solid ${tc.border}`,
          borderRadius: "10px",
          bgcolor: tc.surface,
          overflow: "hidden",
          font: "inherit",
          textAlign: "left",
          cursor: clickable ? "pointer" : "default",
          "&:focus-visible": { outline: `2px solid ${tc.primary}`, outlineOffset: 2 }
        }}
      >
        <Box sx={{ width: 128, height: 72, flex: "none", bgcolor: tc.primaryDeep, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {thumb
            ? <Box component="img" src={thumb} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            : <PlayCircleOutlineIcon sx={{ color: tc.onPrimary, fontSize: 32 }} />}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0, px: "16px", fontWeight: 600, fontSize: 16, color: tc.link }}>{title}</Box>
        {seconds > 0 && <Box sx={{ pr: "16px", fontSize: 13.5, color: tc.textSecondary, whiteSpace: "nowrap" }}>{PlanHelper.formatTime(seconds)}</Box>}
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
        <Box key={key} sx={{ display: "flex", alignItems: "flex-start", gap: "12px", p: "14px 16px", mb: 2, bgcolor: tc.warningBg, borderRadius: "6px", ...markdownSx }}>
          <StickyNote2OutlinedIcon sx={{ color: tc.warning, fontSize: 22, mt: "2px" }} />
          <Box sx={{ flex: 1, minWidth: 0 }}><MarkdownPreviewLight value={text} /></Box>
        </Box>
      );
    }

    if (actionType === "do") {
      return (
        <Box key={key} sx={{ mb: 2, ...markdownSx, "& p, & li": { fontWeight: 600, fontSize: 16 } }}>
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
            "& p": { bgcolor: tc.chip, color: tc.text, borderRadius: "10px", padding: "8px 16px", maxWidth: { xs: "85%", sm: "70%" }, clear: "both", mb: 1 },
            "& p:nth-of-type(even)": { bgcolor: tc.neutralBg, float: "right" }
          }}
        >
          <MarkdownPreviewLight value={text} />
        </Box>
      );
    }

    if (actionType === "add-on" || actionType === "addon") {
      if (findDownloadable(item).url) return renderPlay(item, key);
      return <Typography key={key} sx={{ fontSize: 15, mb: 2 }}>{text}</Typography>;
    }

    if (!text) return null;
    return <Box key={key} sx={{ mb: 2, ...markdownSx }}><MarkdownPreviewLight value={text} /></Box>;
  };

  const sectionDomMap = useMemo(() => {
    const map = new Map<InstructionItem, string>();
    sectionList.forEach(({ item, domId }) => map.set(item, domId));
    return map;
  }, [sectionList]);

  // Flattened so every section is a direct child of the plate (hairlines between them).
  const renderTopLevel = (item: InstructionItem, key: string): React.ReactNode[] => {
    const itemType = item.itemType || "";
    if (SECTION_TYPES.has(itemType)) {
      const domId = sectionDomMap.get(item) || sectionDomId(item, key);
      return [
        <PlateSection key={key} id={domId} title={item.label} sx={{ scrollMarginTop: 8 }}>
          {item.children?.map((child, idx) => renderAction(child, `${key}-${child.id || idx}`))}
        </PlateSection>
      ];
    }
    if (itemType === "header" || (!ACTION_TYPES.has(itemType) && !FILE_TYPES.has(itemType) && item.children?.length)) {
      return (item.children || []).flatMap((child, idx) => renderTopLevel(child, `${key}-${child.id || idx}`));
    }
    const node = renderAction(item, key);
    return node ? [<PlateSection key={key}>{node}</PlateSection>] : [];
  };

  const activeIndex = Math.max(0, sectionList.findIndex((s) => s.domId === activeSection));
  const prev = sectionList[activeIndex - 1];
  const next = sectionList[activeIndex + 1];
  const current = sectionList[activeIndex];

  return (
    <Dialog fullScreen open={open} onClose={onClose} slotProps={{ paper: { sx: { bgcolor: tc.background, backgroundImage: "none" } } }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: "8px", px: "8px", minHeight: 52, bgcolor: tc.surface, borderBottom: `1px solid ${tc.border}`, flex: "none" }}>
        <IconButton onClick={onClose} aria-label={Locale.label("mobile.plans.close")} sx={{ color: tc.text }}>
          <CloseIcon />
        </IconButton>
        <Box sx={{ flex: 1 }} />
        {sectionList.length > 0 && (
          <TextLink onClick={() => setShowSections(true)} sx={{ pr: "10px" }}>
            <FormatListBulletedIcon sx={{ fontSize: 18 }} />{Locale.label("mobile.serving.sections")}
          </TextLink>
        )}
      </Box>

      <Box ref={scrollContainerRef} onScroll={handleScroll} sx={{ flex: 1, overflowY: "auto", py: { xs: "16px", md: "28px" }, px: { md: "32px" } }}>
        <Box sx={{ maxWidth: 820, mx: "auto" }}>
          <PageHead
            title={lessonName || ""}
            lede={current ? Locale.label("mobile.serving.sectionOf").replace("{}", String(activeIndex + 1)).replace("{}", String(sectionList.length)).replace("{}", current.item.label || "") : undefined}
          >
            {prev && <Button variant="outlined" size="small" startIcon={<ChevronLeftIcon />} onClick={() => goToSection(prev.domId)}>{prev.item.label}</Button>}
            {next && <Button variant="outlined" size="small" endIcon={<ChevronRightIcon />} onClick={() => goToSection(next.domId)}>{next.item.label}</Button>}
          </PageHead>
          <Plate>
            {!!instructions.downloads?.length && (
              <PlateSection title={Locale.label("mobile.details.downloads")}>
                <Box data-testid="teach-downloads" sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {instructions.downloads.map((d, idx) => (
                    <TextLink key={d.id || `${d.url}-${idx}`} href={d.url} sx={{ whiteSpace: "normal" }}>{d.title}</TextLink>
                  ))}
                </Box>
              </PlateSection>
            )}
            {instructions.items.flatMap((item, idx) => renderTopLevel(item, `top-${item.id || idx}`))}
          </Plate>
        </Box>
      </Box>

      <Sheet open={showSections} onClose={() => setShowSections(false)} title={Locale.label("mobile.serving.sections")} maxWidth="xs">
        <Box sx={{ display: "flex", flexDirection: "column", gap: "8px", pb: "8px" }}>
          {sectionList.map(({ item, domId }, idx) => {
            const on = domId === activeSection;
            const secs = sectionSeconds(item);
            return (
              <Box
                key={domId}
                component="button"
                type="button"
                aria-current={on ? "true" : undefined}
                onClick={() => goToSection(domId)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  height: 44,
                  px: "16px",
                  borderRadius: 999,
                  border: `1px solid ${on ? "transparent" : tc.control}`,
                  bgcolor: on ? tc.selected : "transparent",
                  color: on ? tc.onSelected : tc.text,
                  fontSize: 14.5,
                  fontWeight: on ? 600 : 500,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  textAlign: "left"
                }}
              >
                <span>{`${idx + 1} · ${item.label || ""}`}</span>
                {secs > 0 && <Box component="span" sx={{ fontSize: 13, color: on ? "inherit" : tc.textSecondary }}>{PlanHelper.formatTime(secs)}</Box>}
              </Box>
            );
          })}
        </Box>
      </Sheet>

      {media && (
        <Dialog open onClose={() => setMedia(null)} fullWidth maxWidth="lg">
          <DialogTitle>{media.label || ""}</DialogTitle>
          <DialogContent sx={{ p: 0, overflow: "hidden" }}>
            <ContentRenderer url={media.url} mediaType={media.mediaType} title={media.label} description={media.description} />
          </DialogContent>
          <DialogActions>
            <Button variant="outlined" onClick={() => setMedia(null)}>{Locale.label("mobile.plans.close")}</Button>
          </DialogActions>
        </Dialog>
      )}
    </Dialog>
  );
};
