"use client";

import React from "react";
import { ApiHelper, ArrayHelper, DateHelper } from "@churchapps/apphelper";
import type { GroupInterface, PersonInterface } from "@churchapps/helpers";
import { Icon } from "@mui/material";
import { TimelineHelper } from "@/helpers/TimelineHelper";
import { TimelinePostInterface } from "@/helpers";

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
  posts: TimelinePostInterface[];
  groups: GroupInterface[];
}

const postTypeIcons: Record<string, string> = {
  task: "task_alt",
  event: "event",
  group: "forum",
  venue: "school",
  sermon: "mic",
};

function getPostTitle(post: TimelinePostInterface): string {
  const data = post.data as Record<string, string> | undefined;
  switch (post.postType) {
    case "task": return data?.title || "Task";
    case "event": return data?.title || "Event";
    case "group": return "Group conversation";
    case "venue": return data?.name || "Lesson";
    case "sermon": return data?.title || "Sermon";
    default: return "Message";
  }
}

function getPostPreview(post: TimelinePostInterface): string {
  const data = post.data as Record<string, string> | undefined;
  switch (post.postType) {
    case "task": return data?.associatedWithLabel || "";
    case "event": return data?.description?.substring(0, 80) || "";
    case "venue": return data?.studyName || "";
    case "sermon": return data?.description?.substring(0, 80) || "";
    default: return "";
  }
}

export function TimelineMasterPanel({ selectedId, onSelect, posts, groups }: Props) {
  return (
    <>
      <div className="masterHeader">
        <h2>
          <Icon sx={{ color: "#1565C0" }}>dynamic_feed</Icon>
          Latest Updates
        </h2>
      </div>
      <div className="masterList">
        {posts.length === 0 && (
          <div style={{ padding: 20, color: "#666" }}>No updates yet.</div>
        )}
        {posts.map((post) => {
          const group = post.groupId ? ArrayHelper.getOne(groups, "id", post.groupId) : null;
          const icon = postTypeIcons[post.postType] || "chat";
          const title = getPostTitle(post);
          const preview = getPostPreview(post);

          return (
            <div
              key={post.postId}
              className={"memberItem" + (selectedId === post.postId ? " selected" : "")}
              onClick={() => onSelect(post.postId)}
            >
              <Icon sx={{ color: "#1565C0", flexShrink: 0 }}>{icon}</Icon>
              <div className="memberInfo">
                <div className="memberName">{title}</div>
                <div className="memberSub">
                  {group ? group.name + " · " : ""}
                  {post.timeSent ? DateHelper.getDisplayDuration(post.timeSent) : ""}
                </div>
                {preview && (
                  <div className="memberSub" style={{ marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {preview}
                  </div>
                )}
              </div>
              <Icon className="memberChevron">chevron_right</Icon>
            </div>
          );
        })}
      </div>
    </>
  );
}
