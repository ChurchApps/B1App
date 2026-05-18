"use client";

import { useState } from "react";
import { Container, Box, Button, ButtonGroup } from "@mui/material";
import { Locale } from "@churchapps/apphelper";
import { YouVersionProvider, BibleReader } from "@youversion/platform-react-ui";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

function ChapterNavigation({ chapter, onChapterChange }: { chapter: string; onChapterChange: (chapter: string) => void }) {
  const chapterNum = parseInt(chapter) || 1;

  const handlePrevious = () => {
    if (chapterNum > 1) onChapterChange(String(chapterNum - 1));
  };

  const handleNext = () => {
    onChapterChange(String(chapterNum + 1));
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 2 }}>
      <ButtonGroup variant="outlined" size="large">
        <Button onClick={handlePrevious} disabled={chapterNum <= 1} startIcon={<ArrowBackIcon />} data-testid="bible-previous-chapter-button">
          {Locale.label("pageSlug.previousChapter")}
        </Button>
        <Button onClick={handleNext} endIcon={<ArrowForwardIcon />} data-testid="bible-next-chapter-button">
          {Locale.label("pageSlug.nextChapter")}
        </Button>
      </ButtonGroup>
    </Box>
  );
}

export function BiblePage() {
  const apiKey = process.env.NEXT_PUBLIC_YOUVERSION_API_KEY || "kcjG9986IOT5ThXvd3lJT1DArk9RBlYt6gzAVNA8Lnb9a8Ld";
  const [chapter, setChapter] = useState("1");
  const [book, setBook] = useState("GEN");
  const [versionId, setVersionId] = useState(12);

  return (
    <Container>
      <h1 style={{ textAlign: "center" }}>{Locale.label("pageSlug.bible")}</h1>
      <YouVersionProvider appKey={apiKey}>
        <div style={{ marginTop: "20px" }}>
          <BibleReader.Root versionId={versionId} onVersionChange={setVersionId} book={book} onBookChange={setBook} chapter={chapter} onChapterChange={setChapter}>
            <BibleReader.Toolbar border="bottom" />
            <ChapterNavigation chapter={chapter} onChapterChange={setChapter} />
            <Box sx={{ maxHeight: "calc(100vh - 350px)", overflowY: "auto", padding: "20px", border: "1px solid #e0e0e0", borderRadius: "4px" }}>
              <BibleReader.Content />
            </Box>
          </BibleReader.Root>
        </div>
      </YouVersionProvider>
    </Container>
  );
}
