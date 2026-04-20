"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Icon } from "@mui/material";

interface MasterDetailLayoutProps {
  masterContent: (props: { selectedId: string | null; onSelect: (id: string) => void }) => React.ReactNode;
  detailContent: (props: { selectedId: string; onBack: () => void; onSelect: (id: string) => void }) => React.ReactNode;
  emptyDetailMessage?: string;
}

function MasterDetailLayoutInner(props: MasterDetailLayoutProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const selectedId = searchParams.get("id");

  const handleSelect = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("id", id);
    const url = pathname + "?" + params.toString();
    const isMobile = typeof window !== "undefined" && window.innerWidth <= 600;
    if (isMobile) {
      router.push(url, { scroll: false });
    } else {
      router.replace(url, { scroll: false });
    }
  };

  const handleBack = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("id");
    const qs = params.toString();
    router.replace(pathname + (qs ? "?" + qs : ""), { scroll: false });
  };

  return (
    <div className="masterDetail" data-has-selection={selectedId ? "true" : "false"}>
      <div className="masterPanel">
        {props.masterContent({ selectedId, onSelect: handleSelect })}
      </div>
      <div className="detailPanel">
        {selectedId
          ? props.detailContent({ selectedId, onBack: handleBack, onSelect: handleSelect })
          : (
            <div className="detailEmpty">
              <Icon style={{ fontSize: 64, opacity: 0.3 }}>person</Icon>
              <p>{props.emptyDetailMessage || "Select an item to view details"}</p>
            </div>
          )}
      </div>
    </div>
  );
}

export function MasterDetailLayout(props: MasterDetailLayoutProps) {
  return (
    <Suspense>
      <MasterDetailLayoutInner {...props} />
    </Suspense>
  );
}
