"use client";

import React, { useCallback, useEffect, useState } from "react";
import { IconButton, Paper } from "@mui/material";
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
// Bold / Italic / Bullets / Numbered row shown under a plain text box while it has focus. A row under the box,
// not a popup over the selection, so a phone's Copy / Select All callout never covers it.
export function FormattingPopup({ textareaRef, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const format = useApplyFormat(textareaRef, value, onChange);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const show = () => setOpen(true);
    const hide = () => setOpen(false);
    setOpen(document.activeElement === el);
    el.addEventListener("focus", show);
    el.addEventListener("blur", hide);
    return () => {
      el.removeEventListener("focus", show);
      el.removeEventListener("blur", hide);
    };
  }, [textareaRef]);

  if (!open) return null;
  return (
    <Paper variant="outlined" sx={{ display: "flex", p: 0.25, mt: 0.5, width: "fit-content" }} data-testid="formatting-popup">
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
  );
}

// Ctrl/Cmd+B and Ctrl/Cmd+I for a plain text box, plus the format row.
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
