"use client";
import React from "react";
import { PlanItemInterface } from "@/helpers";
import { SongDialog } from "./SongDialog";
import { LessonDialog } from "./LessonDialog";
import { ActionDialog } from "./ActionDialog";
import { AddOnDialog } from "./AddOnDialog";

interface Props {
  planItem: PlanItemInterface,
}

export const PlanItem = (props: Props) => {
  const [dialogKeyId, setDialogKeyId] = React.useState<string>(null);
  const [lessonSectionId, setLessonSectionId] = React.useState<string>(null);
  const [actionId, setActionId] = React.useState<string>(null);
  const [addOnId, setAddOnId] = React.useState<string>(null);

  const getChildren = () => {
    const result: React.ReactElement[] = [];
    props.planItem.children?.forEach((c) => {
      result.push(
        <PlanItem key={c.id} planItem={c} />
      );
    });
    return result;
  }

  const getHeaderRow = () => <>
    {getChildren()}
  </>

  const getItemRow = () => <>
    <div className="planItem">
      <div>{formatTime(props.planItem.seconds)}</div>
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
      <div>{formatTime(props.planItem.seconds)}</div>
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
      <div>{formatTime(props.planItem.seconds)}</div>
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
      <div>{formatTime(props.planItem.seconds)}</div>
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

  const getDescriptionRow = () => <div className="planItemDescription">{props.planItem.description}</div>

  const getPlanItem = () => {
    switch (props.planItem.itemType) {
      case "header": return getHeaderRow();
      case "song":
      case "arrangementKey":
        return getSongRow();
      case "action": return getActionRow();
      case "addOn": return getAddOnRow();
      case "item": return getItemRow();
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return minutes + ":" + (secs < 10 ? "0" : "") + secs;
  }

  return (<>
    {getPlanItem()}
    {dialogKeyId && <SongDialog arrangementKeyId={dialogKeyId} onClose={() => { setDialogKeyId(null); }} />}
    {lessonSectionId && <LessonDialog sectionId={lessonSectionId} sectionName={props.planItem.label} onClose={() => { setLessonSectionId(null); }} />}
    {actionId && <ActionDialog actionId={actionId} actionName={props.planItem.label} onClose={() => { setActionId(null); }} />}
    {addOnId && <AddOnDialog addOnId={addOnId} addOnName={props.planItem.label} onClose={() => { setAddOnId(null); }} />}
  </>)
};
