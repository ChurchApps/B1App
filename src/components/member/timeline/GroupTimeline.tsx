"use client";

import React from "react";
import { ApiHelper } from "@churchapps/apphelper";
import type { GroupInterface, PersonInterface, UserContextInterface } from "@churchapps/helpers";
import { TimelinePost } from "./TimelinePost";
import { TimelineHelper } from "@/helpers/TimelineHelper";

interface Props { context: UserContextInterface; groupId: string;}

export const GroupTimeline: React.FC<Props> = (props) => {
  const [posts, setPosts] = React.useState<any[]>([]);
  const [people, setPeople] = React.useState<PersonInterface[]>([]);
  const [groups, setGroups] = React.useState<GroupInterface[]>([]);

  const loadData = async () => {
    if (ApiHelper.isAuthenticated) {
      const {posts, people, groups} = await TimelineHelper.loadForGroup(props.groupId);
      setPeople(people);
      setGroups(groups);
      setPosts(posts);
    }
  }

  React.useEffect(() => { loadData() }, [ApiHelper.isAuthenticated]);

  if (posts?.length > 0) return (
    <>
      <h1>Latest Updates</h1>
      {posts.map((post) => (
        <TimelinePost condensed={true} post={post} key={post.postId} context={props.context} people={people} groups={groups} onUpdate={loadData} />
      ))}
    </>
  );
  else return <></>
}
