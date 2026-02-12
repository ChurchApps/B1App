"use client";

import React from "react";
import { ApiHelper } from "@churchapps/apphelper";
import type { GroupInterface, PersonInterface, UserContextInterface } from "@churchapps/helpers";
import { TimelinePost } from "./TimelinePost";
import { TimelineHelper } from "@/helpers/TimelineHelper";
import { TimelinePostInterface } from "@/helpers";

interface Props { context: UserContextInterface; }

export const Timeline: React.FC<Props> = (props) => {
  const [posts, setPosts] = React.useState<TimelinePostInterface[]>([]);
  const [people, setPeople] = React.useState<PersonInterface[]>([]);
  const [groups, setGroups] = React.useState<GroupInterface[]>([]);

  const loadData = async () => {
    if (ApiHelper.isAuthenticated) {
      const { posts, people, groups } = await TimelineHelper.loadForUser();
      setPeople(people);
      setGroups(groups);
      setPosts(posts);
    }
  };



  React.useEffect(() => { loadData(); }, [ApiHelper.isAuthenticated]);

  if (posts?.length > 0) {
    return (
      <>
        {posts.map((post) => (
          <TimelinePost post={post} key={post.postId} context={props.context} people={people} groups={groups} onUpdate={loadData} />
        ))}
      </>
    );
  } else return <></>;
};
