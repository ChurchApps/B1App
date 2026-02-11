"use client";

import React, { useState, useEffect } from "react";
import { ApiHelper, ArrayHelper, DateHelper } from "@churchapps/apphelper";
import type { AssignmentInterface, PlanInterface, PositionInterface, TimeInterface } from "@churchapps/helpers";
import { Icon } from "@mui/material";

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

interface ServingTimeData {
  assignmentId: string;
  planId: string;
  planName: string;
  serviceDate: Date;
  position: string;
  status: string;
}

export function PlansMasterPanel({ selectedId, onSelect }: Props) {
  const [assignments, setAssignments] = useState<AssignmentInterface[]>([]);
  const [positions, setPositions] = useState<PositionInterface[]>([]);
  const [plans, setPlans] = useState<PlanInterface[]>([]);
  const [times, setTimes] = useState<TimeInterface[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const tempAssignments: AssignmentInterface[] = await ApiHelper.get("/assignments/my", "DoingApi");
      if (tempAssignments.length > 0) {
        setAssignments(tempAssignments);
        const positionIds = ArrayHelper.getUniqueValues(tempAssignments, "positionId");
        const tempPositions = await ApiHelper.get("/positions/ids?ids=" + positionIds, "DoingApi");
        if (tempPositions.length > 0) {
          setPositions(tempPositions);
          const planIds = ArrayHelper.getUniqueValues(tempPositions, "planId");
          ApiHelper.get("/plans/ids?ids=" + planIds, "DoingApi").then((data: PlanInterface[]) => setPlans(data));
          ApiHelper.get("/times/plans?planIds=" + planIds, "DoingApi").then((data: TimeInterface[]) => setTimes(data));
        }
      }
    };
    loadData();
  }, []);

  const getServingData = (): ServingTimeData[] => {
    const data: ServingTimeData[] = [];
    assignments.forEach((assignment) => {
      const position = positions.find((p) => p.id === assignment.positionId);
      const plan = plans.find((p) => p.id === position?.planId);
      if (position && plan) {
        data.push({
          assignmentId: assignment.id,
          planId: plan.id,
          planName: plan.name,
          serviceDate: new Date(plan.serviceDate),
          position: position.name,
          status: assignment.status || "Unconfirmed"
        });
      }
    });
    ArrayHelper.sortBy(data, "serviceDate", true);
    return data;
  };

  const getStatusColor = (status: string) => {
    if (status === "Accepted") return "#2e7d32";
    if (status === "Declined") return "#d32f2f";
    return "#ed6c02";
  };

  const servingData = getServingData();

  return (
    <>
      <div className="masterHeader">
        <h2>
          <Icon sx={{ color: "#1565C0" }}>assignment</Icon>
          My Plans
        </h2>
      </div>
      <div className="masterList">
        <div
          className={"memberItem" + (selectedId === "blockout" ? " selected" : "")}
          onClick={() => onSelect("blockout")}
        >
          <Icon sx={{ color: "#1565C0", flexShrink: 0 }}>block</Icon>
          <div className="memberInfo">
            <div className="memberName">Blockout Dates</div>
            <div className="memberSub">Manage dates you&apos;re unavailable</div>
          </div>
          <Icon className="memberChevron">chevron_right</Icon>
        </div>

        {servingData.length === 0 && assignments.length === 0 && (
          <div style={{ padding: 20, color: "#666" }}>No serving assignments found.</div>
        )}
        {servingData.map((d) => (
          <div
            key={d.assignmentId}
            className={"memberItem" + (selectedId === d.planId ? " selected" : "")}
            onClick={() => onSelect(d.planId)}
          >
            <Icon sx={{ color: "#1565C0", flexShrink: 0 }}>assignment</Icon>
            <div className="memberInfo">
              <div className="memberName">{d.planName}</div>
              <div className="memberSub">
                {DateHelper.prettyDate(d.serviceDate)} &middot; {d.position}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0 }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: getStatusColor(d.status) }}>{d.status}</span>
              <Icon className="memberChevron">chevron_right</Icon>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
