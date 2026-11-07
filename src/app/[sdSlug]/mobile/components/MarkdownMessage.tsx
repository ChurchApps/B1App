"use client";

import React from "react";
import { Box, type SxProps, type Theme } from "@mui/material";
import { MarkdownPreviewLight } from "@churchapps/apphelper/markdown";
import { withHardBreaks } from "./formatting";

interface Props {
  text: string;
  sx?: SxProps<Theme>;
}

// Chat and note text rendered as light markdown: **bold**, _italic_, lists, autolinked URLs.
export function MarkdownMessage({ text, sx }: Props) {
  const ref = React.useRef<HTMLDivElement>(null);

  // Links in messages have always opened in a new tab.
  React.useEffect(() => {
    ref.current?.querySelectorAll("a").forEach((a) => {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    });
  }, [text]);

  return (
    <Box
      ref={ref}
      data-testid="message-text"
      sx={[
        { overflowWrap: "anywhere", "& p": { m: 0 }, "& p + p": { mt: "8px" }, "& ul, & ol": { my: "4px", pl: "20px" }, "& a": { color: "inherit", textDecoration: "underline", overflowWrap: "anywhere" } },
        ...(Array.isArray(sx) ? sx : [sx])
      ]}
    >
      <MarkdownPreviewLight value={withHardBreaks(text)} />
    </Box>
  );
}
