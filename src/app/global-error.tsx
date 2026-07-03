"use client";

import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    // Only capture in production to avoid Turbopack symlink issues on Windows
    if (process.env.NODE_ENV === "production") {
      import("@sentry/nextjs").then((Sentry) => {
        Sentry.captureException(error);
      });
    }
  }, [error]);

  return (
    <html>
      <body>
        {/* NextError requires statusCode; App Router doesn't expose one, so pass 0 for generic message. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
