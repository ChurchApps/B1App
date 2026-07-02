"use client";

import { Activity, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MobilePageWrapper } from "./MobilePageWrapper";
import { ScreenRouter } from "./ScreenRouter";
import { canonicalTab } from "./mobileTabs";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface Props {
  sdSlug: string;
  config: ConfigurationInterface;
  children: React.ReactNode;
}

export function MobileKeepAlive({ sdSlug, config, children }: Props) {
  const params = useParams<{ pageSlug?: string; id?: string }>();
  const raw = params?.pageSlug;
  // A detail route (id present) canonicalizes to a kept tab too, so its list
  // stays mounted but hidden while the detail renders via {children}.
  const tab = raw && !params?.id ? canonicalTab(raw) : undefined;

  const [visited, setVisited] = useState<string[]>(() => (tab ? [tab] : []));
  if (tab && !visited.includes(tab)) setVisited([...visited, tab]);

  const scrollPositions = useRef<Record<string, number>>({});
  useIsoLayoutEffect(() => {
    if (!tab) return;
    const saved = scrollPositions.current[tab] ?? 0;
    const onScroll = () => { scrollPositions.current[tab] = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });
    // Restore after Next's own scroll-to-top; double rAF outlasts its reset.
    const raf1 = requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, saved)));
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf1);
    };
  }, [tab]);

  if (!raw) return <>{children}</>;

  return (
    <MobilePageWrapper sdSlug={sdSlug} config={config}>
      {visited.map((s) => (
        <Activity key={s} mode={s === tab ? "visible" : "hidden"} name={"tab-" + s}>
          <ScreenRouter pageSlug={s} config={config} />
        </Activity>
      ))}
      {children}
    </MobilePageWrapper>
  );
}
