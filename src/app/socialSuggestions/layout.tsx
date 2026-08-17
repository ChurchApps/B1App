import React from "react";

// Rendered per request so the CSP nonce issued in middleware reaches the
// scripts Next injects. A prerendered copy would ship without a nonce and its
// bootstrap scripts would be blocked by script-src.
export const dynamic = "force-dynamic";

export default function SocialSuggestionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
