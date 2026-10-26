"use client";
import { useEffect, useRef } from "react";

export function BlogFooterEmbed({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    let cancelled = false;
    const template = document.createElement("template");
    template.innerHTML = html;
    root.replaceChildren(template.content);
    // innerHTML-inserted scripts never execute; recreate them (CSP 'strict-dynamic' trusts these).
    // Run in order: vendor snippets load a library via src, then call it inline.
    const run = async () => {
      for (const old of Array.from(root.querySelectorAll("script"))) {
        if (cancelled) return;
        const script = document.createElement("script");
        Array.from(old.attributes).forEach((attr) => script.setAttribute(attr.name, attr.value));
        script.text = old.text;
        if (script.src) await new Promise((resolve) => { script.onload = resolve; script.onerror = resolve; old.replaceWith(script); });
        else old.replaceWith(script);
      }
    };
    run();
    return () => { cancelled = true; root.replaceChildren(); };
  }, [html]);
  return <div ref={ref} />;
}
