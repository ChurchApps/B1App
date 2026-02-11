"use client";

import { Container } from "@mui/material";
// Import the new YouVersion component
// eslint-disable-next-line unused-imports/no-unused-imports
import { BiblePageYouVersion } from "./BiblePageYouVersion";

/**
 * Bible Page Component
 *
 * TOGGLE BETWEEN OLD AND NEW BIBLE:
 * - To use the NEW YouVersion SDK Bible: uncomment line 15 and comment out lines 18-26
 * - To use the OLD Biblia.com Bible: uncomment lines 18-26 and comment out line 15
 */
export function BiblePage() {
  // NEW: YouVersion SDK Bible (uncomment this to use YouVersion)
  // return <BiblePageYouVersion />;

  // OLD: Biblia.com Bible (comment this out when ready to switch to YouVersion)
  return (
    <Container>
      <h1 style={{ textAlign: "center" }}>Bible</h1>
      <iframe
        title="content"
        className="full-frame"
        src="https://biblia.com/api/plugins/embeddedbible?layout=normal&historyButtons=false&resourcePicker=false&shareButton=false&textSizeButton=false&startingReference=Ge1.1&resourceName=nirv"
      />
    </Container>
  );
}
