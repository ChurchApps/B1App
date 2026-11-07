"use client";

import React, { useCallback, useEffect, useState } from "react";
import { IconButton, Paper, Popper } from "@mui/material";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import { Locale } from "@churchapps/apphelper";
import { applyFormat, type FormatKind } from "./formatting";

type TextareaRef = React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>;

const BUTTONS: { kind: FormatKind; Icon: typeof FormatBoldIcon; key: string; fallback: string }[] = [
  { kind: "bold", Icon: FormatBoldIcon, key: "mobile.format.bold", fallback: "Bold" },
  { kind: "italic", Icon: FormatItalicIcon, key: "mobile.format.italic", fallback: "Italic" },
  { kind: "bullets", Icon: FormatListBulletedIcon, key: "mobile.format.bullets", fallback: "Bulleted list" },
  { kind: "numbered", Icon: FormatListNumberedIcon, key: "mobile.format.numbered", fallback: "Numbered list" }
];

function useApplyFormat(textareaRef: TextareaRef, value: string, onChange: (value: string) => void) {
  return useCallback((kind: FormatKind) => {
    const el = textareaRef.current;
    if (!el) return;
    const result = applyFormat(value || "", el.selectionStart ?? 0, el.selectionEnd ?? 0, kind);
    onChange(result.value);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(result.start, result.end);
    });
  }, [textareaRef, value, onChange]);
}

interface Props {
  textareaRef: TextareaRef;
  value: string;
  onChange: (value: string) => void;
}

// Mirrors Packages/apphelper/src/components/notes/FormattingPopup.tsx.
// Bold / Italic / Bullets / Numbered popup shown over highlighted text in a plain text box.
export function FormattingPopup({ textareaRef, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const format = useApplyFormat(textareaRef, value, onChange);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const update = () => setOpen(document.activeElement === el && (el.selectionStart ?? 0) !== (el.selectionEnd ?? 0));
    const close = () => setOpen(false);
    const events = ["select", "keyup", "mouseup", "focus"];
    events.forEach((e) => el.addEventListener(e, update));
    el.addEventListener("blur", close);
    return () => {
      events.forEach((e) => el.removeEventListener(e, update));
      el.removeEventListener("blur", close);
    };
  }, [textareaRef]);

  const anchor = textareaRef.current;
  return (
    <Popper open={open && !!anchor} anchorEl={anchor} placement="top-start" sx={{ zIndex: (theme) => theme.zIndex.tooltip }}>
      <Paper elevation={4} sx={{ display: "flex", p: 0.25, mb: 0.5 }} data-testid="formatting-popup">
        {BUTTONS.map((b) => (
          <IconButton
            key={b.kind}
            size="small"
            aria-label={Locale.label(b.key, b.fallback)}
            title={Locale.label(b.key, b.fallback)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => format(b.kind)}
          >
            <b.Icon fontSize="small" />
          </IconButton>
        ))}
      </Paper>
    </Popper>
  );
}

// Ctrl/Cmd+B and Ctrl/Cmd+I for a plain text box, plus the highlight popup.
export function useFormattingShortcuts(textareaRef: TextareaRef, value: string, onChange: (value: string) => void) {
  const format = useApplyFormat(textareaRef, value, onChange);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
    const key = e.key.toLowerCase();
    if (key !== "b" && key !== "i") return;
    e.preventDefault();
    format(key === "b" ? "bold" : "italic");
  }, [format]);

  const popup = <FormattingPopup textareaRef={textareaRef} value={value} onChange={onChange} />;
  return { onKeyDown, popup };
}
