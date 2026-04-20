"use client";

import React from "react";
import { Icon } from "@mui/material";
import { ArrayHelper } from "@churchapps/apphelper";
import type { GroupInterface, PersonInterface, UserContextInterface } from "@churchapps/helpers";
import { TimelinePost } from "@/components/member/timeline/TimelinePost";
import { TimelinePostInterface } from "@/helpers";

interface Props {
  postId: string;
  onBack: () => void;
  posts: TimelinePostInterface[];
  people: PersonInterface[];
  groups: GroupInterface[];
  context: UserContextInterface;
  onUpdate: () => void;
}

export function TimelineDetailPanel({ postId, onBack, posts, people, groups, context, onUpdate }: Props) {
  const post = ArrayHelper.getOne(posts, "postId", postId);

  if (!post) {
    return (
      <div style={{ padding: 20, color: "#666" }}>
        <p>Post not found.</p>
      </div>
    );
  }

  return (
    <>
      <button className="detailBackBtn" onClick={onBack}>
        <Icon sx={{ fontSize: 20 }}>arrow_back</Icon>
        Back to updates
      </button>
      <TimelinePost post={post} context={context} people={people} groups={groups} onUpdate={onUpdate} />
    </>
  );
}
