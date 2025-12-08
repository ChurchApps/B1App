"use client";

import { Container } from "@mui/material";
import { useState, useEffect } from "react";

export function VotdPage() {
  const [shape, setShape] = useState("16x9");
  const [day, setDay] = useState(1);

  const getShape = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const ratio = width / height;

    const diff1x1 = Math.abs(ratio - 1);
    const diff16x9 = Math.abs(ratio - 1.777);
    const diff9x16 = Math.abs(ratio - 0.5625);
    let result = "1x1";
    if (diff16x9 < diff1x1) result = "16x9";
    else if (diff9x16 < diff1x1) result = "9x16";
    setShape(result);
  };

  const getDayOfYear = () => {
    let now = new Date();
    let start = new Date(now.getFullYear(), 0, 0);
    let diff = now.getTime() - start.getTime();
    let oneDay = 1000 * 60 * 60 * 24;
    let day = Math.floor(diff / oneDay);
    return day;
  };

  useEffect(() => {
    getShape();
    setDay(getDayOfYear());
    window.addEventListener("resize", getShape);
    return () => window.removeEventListener("resize", getShape);
  }, []);

  return (
    <Container>
      <h1 style={{textAlign:"center"}}>Verse of the Day</h1>
      <img
        src={"https://votd.org/v1/" + day + "/" + shape + ".jpg"}
        className="full-frame"
        alt="Verse of the Day"
      />
    </Container>
  );
}
