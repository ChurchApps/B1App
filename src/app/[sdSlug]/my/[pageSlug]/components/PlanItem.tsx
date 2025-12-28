"use client";
import React from "react";
import { Icon } from "@mui/material";
import { PlanItemInterface, PlanHelper } from "@/helpers";
import { SongDialog } from "./SongDialog";
import { LessonDialog } from "./LessonDialog";
import { ActionDialog } from "./ActionDialog";
import { AddOnDialog } from "./AddOnDialog";

interface Props {
  planItem: PlanItemInterface,
  startTime?: number,
}

export const PlanItem = (props: Props) => {
  const [dialogKeyId, setDialogKeyId] = React.useState<string>(null);
  const [lessonSectionId, setLessonSectionId] = React.useState<string>(null);
  const [actionId, setActionId] = React.useState<string>(null);
  const [addOnId, setAddOnId] = React.useState<string>(null);

  const getChildren = () => {
    const result: React.ReactElement[] = [];
    let cumulativeTime = props.startTime || 0;
    props.planItem.children?.forEach((c) => {
      const childStartTime = cumulativeTime;
      result.push(
        <PlanItem key={c.id} planItem={c} startTime={childStartTime} />
      );
      cumulativeTime += c.seconds || 0;
    });
    return result;
  }

  const getHeaderRow = () => {
    const sectionDuration = PlanHelper.getSectionDuration(props.planItem);
    return <>
      <div className="planItemHeader">
        <span style={{ float: "right", display: "flex", alignItems: "center", gap: 4 }}>
          {sectionDuration > 0 && <Icon style={{ fontSize: 16, color: "#999" }}>schedule</Icon>}
          <span style={{ color: "#666", fontSize: "0.9em", minWidth: 40, textAlign: "right" }}>
            {sectionDuration > 0 ? PlanHelper.formatTime(sectionDuration) : ""}
          </span>
        </span>
        <span>{props.planItem.label}</span>
      </div>
      {getChildren()}
    </>;
  }

  const getItemRow = () => <>
    <div className="planItem">
      <span style={{ float: "right", display: "flex", alignItems: "center", gap: 4 }}>
        <Icon style={{ fontSize: 16, color: "#999" }}>schedule</Icon>
        <span style={{ color: "#666", fontSize: "0.9em", minWidth: 40, textAlign: "right" }}>
          {PlanHelper.formatTime(props.planItem.seconds)}
        </span>
      </span>
      <div>{PlanHelper.formatTime(props.startTime || 0)}</div>
      <div>
        {props.planItem.relatedId ? (
          <a href="about:blank" onClick={(e) => { e.preventDefault(); setLessonSectionId(props.planItem.relatedId); }}>
            {props.planItem.label}
          </a>
        ) : props.planItem.link ? (
          <a href={props.planItem.link} target="_blank" rel="noopener noreferrer">
            {props.planItem.label}
          </a>
        ) : (
          props.planItem.label
        )}
      </div>
      {getDescriptionRow()}
    </div>
  </>

  const getSongRow = () => <>
    <div className="planItem">
      <span style={{ float: "right", display: "flex", alignItems: "center", gap: 4 }}>
        <Icon style={{ fontSize: 16, color: "#999" }}>schedule</Icon>
        <span style={{ color: "#666", fontSize: "0.9em", minWidth: 40, textAlign: "right" }}>
          {PlanHelper.formatTime(props.planItem.seconds)}
        </span>
      </span>
      <div>{PlanHelper.formatTime(props.startTime || 0)}</div>
      <div>
        <a href="about:blank" onClick={(e) => { e.preventDefault(); setDialogKeyId(props.planItem.relatedId); }}>
          {props.planItem.label}
        </a>
      </div>
      {getDescriptionRow()}
    </div>
  </>

  const getActionRow = () => <>
    <div className="planItem">
      <span style={{ float: "right", display: "flex", alignItems: "center", gap: 4 }}>
        <Icon style={{ fontSize: 16, color: "#999" }}>schedule</Icon>
        <span style={{ color: "#666", fontSize: "0.9em", minWidth: 40, textAlign: "right" }}>
          {PlanHelper.formatTime(props.planItem.seconds)}
        </span>
      </span>
      <div>{PlanHelper.formatTime(props.startTime || 0)}</div>
      <div>
        {props.planItem.relatedId ? (
          <a href="about:blank" onClick={(e) => { e.preventDefault(); setActionId(props.planItem.relatedId); }}>
            {props.planItem.label}
          </a>
        ) : (
          props.planItem.label
        )}
      </div>
      {getDescriptionRow()}
    </div>
  </>

  const getAddOnRow = () => <>
    <div className="planItem">
      <span style={{ float: "right", display: "flex", alignItems: "center", gap: 4 }}>
        <Icon style={{ fontSize: 16, color: "#999" }}>schedule</Icon>
        <span style={{ color: "#666", fontSize: "0.9em", minWidth: 40, textAlign: "right" }}>
          {PlanHelper.formatTime(props.planItem.seconds)}
        </span>
      </span>
      <div>{PlanHelper.formatTime(props.startTime || 0)}</div>
      <div>
        {props.planItem.relatedId ? (
          <a href="about:blank" onClick={(e) => { e.preventDefault(); setAddOnId(props.planItem.relatedId); }}>
            {props.planItem.label}
          </a>
        ) : (
          props.planItem.label
        )}
      </div>
      {getDescriptionRow()}
    </div>
  </>

  const getLessonSectionRow = () => <>
    <div className="planItem">
      <span style={{ float: "right", display: "flex", alignItems: "center", gap: 4 }}>
        <Icon style={{ fontSize: 16, color: "#999" }}>schedule</Icon>
        <span style={{ color: "#666", fontSize: "0.9em", minWidth: 40, textAlign: "right" }}>
          {PlanHelper.formatTime(props.planItem.seconds)}
        </span>
      </span>
      <div>{PlanHelper.formatTime(props.startTime || 0)}</div>
      <div>
        {props.planItem.relatedId ? (
          <a href="about:blank" onClick={(e) => { e.preventDefault(); setLessonSectionId(props.planItem.relatedId); }}>
            {props.planItem.label}
          </a>
        ) : (
          props.planItem.label
        )}
      </div>
      {getDescriptionRow()}
    </div>
  </>

  const getDescriptionRow = () => <div className="planItemDescription">{props.planItem.description}</div>

  const getPlanItem = () => {
    switch (props.planItem.itemType) {
      case "header": return getHeaderRow();
      case "song":
      case "arrangementKey":
        return getSongRow();
      case "lessonAction": return getActionRow();
      case "lessonAddOn": return getAddOnRow();
      case "lessonSection": return getLessonSectionRow();
      case "item":
      default:
        return getItemRow();
    }
  }

  return (<>
    {getPlanItem()}
    {dialogKeyId && <SongDialog arrangementKeyId={dialogKeyId} onClose={() => { setDialogKeyId(null); }} />}
    {lessonSectionId && <LessonDialog sectionId={lessonSectionId} sectionName={props.planItem.label} onClose={() => { setLessonSectionId(null); }} />}
    {actionId && <ActionDialog actionId={actionId} actionName={props.planItem.label} onClose={() => { setActionId(null); }} />}
    {addOnId && <AddOnDialog addOnId={addOnId} addOnName={props.planItem.label} onClose={() => { setAddOnId(null); }} />}
  </>)
};
