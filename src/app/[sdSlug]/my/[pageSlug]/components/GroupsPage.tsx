"use client";

import { MasterDetailLayout } from "./MasterDetailLayout";
import { GroupsMasterPanel } from "./GroupsMasterPanel";

export function GroupsPage() {
  return (
    <MasterDetailLayout
      emptyDetailMessage="Select a group to view details"
      masterContent={() => (
        <GroupsMasterPanel />
      )}
      detailContent={() => null}
    />
  );
}
