"use client";
import React, { useEffect, useState } from "react";
import { Locale, PresenceStore, type PresenceSnapshot } from "@churchapps/apphelper";

interface Props { conversationId: string }

interface CombinedPerson { displayName: string; count: number }

export const Attendance: React.FC<Props> = (props) => {
  const [showList, setShowList] = useState(false);
  const [snapshot, setSnapshot] = useState<PresenceSnapshot | null>(null);

  useEffect(() => {
    if (!props.conversationId) return;
    return PresenceStore.subscribe(props.conversationId, setSnapshot);
  }, [props.conversationId]);

  const viewers = snapshot?.viewers ?? [];

  const toggleAttendance = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowList(!showList);
  };

  const getViewerCount = () => {
    const totalViewers = viewers.length;
    if (totalViewers === 1) return Locale.label("video.chat.oneAttendee");
    return Locale.label("video.chat.attendees").replace("{}", totalViewers.toString());
  };

  const getCombinedPeople = (): CombinedPerson[] => {
    let lastName: string | null = null;
    const result: CombinedPerson[] = [];
    for (const v of viewers) {
      if (v.displayName === lastName) result[result.length - 1].count++;
      else result.push({ displayName: v.displayName, count: 1 });
      lastName = v.displayName;
    }
    return result;
  };

  const getPeople = () => {
    if (!showList) return null;
    const combined = getCombinedPeople();
    return (
      <div id="attendance">
        {combined.map((v, i) => (
          <div key={i}><i className="person"></i>{v.displayName}{v.count > 1 ? <span> ({v.count})</span> : null}</div>
        ))}
      </div>
    );
  };

  return (
    <>
      {getPeople()}
      <a id="attendanceCount" href="about:blank" onClick={toggleAttendance}>
        {getViewerCount()} <i className={showList ? "expand_less" : "expand_more"}></i>
      </a>
    </>
  );
};
