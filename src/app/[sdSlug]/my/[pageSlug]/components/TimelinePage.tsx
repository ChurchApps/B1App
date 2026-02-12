"use client";

import React, { useContext, useState, useEffect } from "react";
import { ApiHelper } from "@churchapps/apphelper";
import type { GroupInterface, PersonInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { TimelineHelper } from "@/helpers/TimelineHelper";
import { TimelinePostInterface } from "@/helpers";
import { MasterDetailLayout } from "./MasterDetailLayout";
import { TimelineMasterPanel } from "./TimelineMasterPanel";
import { TimelineDetailPanel } from "./TimelineDetailPanel";

export function TimelinePage() {
  const context = useContext(UserContext);
  const [posts, setPosts] = useState<TimelinePostInterface[]>([]);
  const [people, setPeople] = useState<PersonInterface[]>([]);
  const [groups, setGroups] = useState<GroupInterface[]>([]);

  const loadData = async () => {
    if (ApiHelper.isAuthenticated) {
      const result = await TimelineHelper.loadForUser();
      setPeople(result.people);
      setGroups(result.groups);
      setPosts(result.posts);
    }
  };

  useEffect(() => { loadData(); }, [ApiHelper.isAuthenticated]);

  return (
    <MasterDetailLayout
      emptyDetailMessage="Select an update to view details"
      masterContent={({ selectedId, onSelect }) => (
        <TimelineMasterPanel selectedId={selectedId} onSelect={onSelect} posts={posts} groups={groups} />
      )}
      detailContent={({ selectedId, onBack }) => (
        <TimelineDetailPanel postId={selectedId} onBack={onBack} posts={posts} people={people} groups={groups} context={context} onUpdate={loadData} />
      )}
    />
  );
}
