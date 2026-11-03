"use client";

import type { ElementInterface } from "@/helpers";
import { GroupsBrowser } from "../groups/GroupsBrowser";

interface Props { element: ElementInterface; churchId: string; }

// Groups Browser element: the searchable group directory, as a grid or (layout "autoscroll") one row that scrolls by itself.
export const GroupsBrowserElement = ({ element, churchId }: Props) => {
  const a = element.answers || {};
  return (
    <div id={"el-" + element.id}>
      <GroupsBrowser
        churchId={churchId}
        category={(a.category as string) || undefined}
        label={(a.label as string) || undefined}
        title={(a.title as string) || undefined}
        showSearch={a.showSearch !== false && a.showSearch !== "false"}
        showCategory={a.showCategory !== false && a.showCategory !== "false"}
        layout={a.layout === "autoscroll" ? "autoscroll" : "grid"}
      />
    </div>
  );
};
