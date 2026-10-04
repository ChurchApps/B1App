"use client";

import { useEffect, useState } from "react";
import { Container, Box, Button, ButtonGroup, Typography } from "@mui/material";
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
  const apiKey = process.env.NEXT_PUBLIC_YOUVERSION_API_KEY || "";
  const [chapter, setChapter] = useState("1");
  const [book, setBook] = useState("GEN");
  const [versionId, setVersionId] = useState(12);
  // The YouVersion reader throws without an app key and only runs in the browser; either way the page used to 500.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!apiKey) {
    return (
      <Container sx={{ textAlign: "center" }}>
        <h1>{Locale.label("pageSlug.bible", "Bible")}</h1>
        <Typography sx={{ mb: 2 }}>{Locale.label("pageSlug.bibleUnavailable")}</Typography>
        <Button variant="contained" href="https://www.bible.com" target="_blank" rel="noopener noreferrer">{Locale.label("pageSlug.openBibleCom")}</Button>
      </Container>
    );
  }

  return (
    <Container>
      <h1 style={{ textAlign: "center" }}>{Locale.label("pageSlug.bible", "Bible")}</h1>
      {mounted && <YouVersionProvider appKey={apiKey}>
        <div style={{ marginTop: "20px" }}>
          <BibleReader.Root versionId={versionId} onVersionChange={setVersionId} book={book} onBookChange={setBook} chapter={chapter} onChapterChange={setChapter}>
            <BibleReader.Toolbar border="bottom" />
            <ChapterNavigation chapter={chapter} onChapterChange={setChapter} />
            <Box sx={{ maxHeight: "calc(100vh - 350px)", overflowY: "auto", padding: "20px", border: "1px solid #e0e0e0", borderRadius: "4px" }}>
              <BibleReader.Content />
            </Box>
          </BibleReader.Root>
        </div>
      </YouVersionProvider>}
    </Container>
  );
}
