"use client";

import { useEffect } from "react";

// Tells the host page how tall the content is so it can size the iframe (the script in B1Admin's embed code
// listens for this). The message goes to any origin because the page cannot know who frames it; it carries
// the height and nothing else.
export function EmbedHeightReporter() {
  useEffect(() => {
    if (window.parent === window) return;
    let last = 0;
    const report = () => {
      const height = Math.ceil(document.documentElement.getBoundingClientRect().height);
      if (!height || height === last) return;
      last = height;
      window.parent.postMessage({ type: "b1-embed-height", height }, "*");
    };
    const observer = new ResizeObserver(report);
    observer.observe(document.documentElement);
    observer.observe(document.body);
    report();
    return () => observer.disconnect();
  }, []);

  return null;
}
