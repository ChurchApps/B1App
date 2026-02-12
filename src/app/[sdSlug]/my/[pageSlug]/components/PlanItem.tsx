"use client";
import React from "react";
import { Icon } from "@mui/material";
import { PlanItemInterface, PlanHelper } from "@/helpers";
import { SongDialog } from "./SongDialog";
import { LessonDialog } from "./LessonDialog";
import { ActionDialog } from "./ActionDialog";

interface Props {
  planItem: PlanItemInterface;
  startTime?: number;
  associatedProviderId?: string;
  associatedVenueId?: string;
  ministryId?: string;
}

export const PlanItem = (props: Props) => {
  const [dialogKeyId, setDialogKeyId] = React.useState<string>(null);
  const [lessonSectionId, setLessonSectionId] = React.useState<string>(null);
  const [actionId, setActionId] = React.useState<string>(null);

  const pi = props.planItem;
  const hasProviderFields = pi.providerId && pi.providerPath && pi.providerContentPath;

  const getChildren = () => {
    const result: React.ReactElement[] = [];
    let cumulativeTime = props.startTime || 0;
    pi.children?.forEach((c) => {
      const childStartTime = cumulativeTime;
      result.push(
        <PlanItem
          key={c.id}
          planItem={c}
          startTime={childStartTime}
          associatedProviderId={props.associatedProviderId}
          associatedVenueId={props.associatedVenueId}
          ministryId={props.ministryId}
        />
      );
      cumulativeTime += c.seconds || 0;
    });
    return result;
  };

  const getHeaderRow = () => {
    const sectionDuration = PlanHelper.getSectionDuration(pi);
    return <>
      <div className="planItemHeader">
        <span style={{ float: "right", display: "flex", alignItems: "center", gap: 4 }}>
          {sectionDuration > 0 && <Icon style={{ fontSize: 16, color: "#999" }}>schedule</Icon>}
          <span style={{ color: "#666", fontSize: "0.9em", minWidth: 40, textAlign: "right" }}>
            {sectionDuration > 0 ? PlanHelper.formatTime(sectionDuration) : ""}
          </span>
        </span>
        <span>{pi.label}</span>
      </div>
      {getChildren()}
    </>;
  };

  const getDescriptionRow = () => <div className="planItemDescription">{pi.description}</div>;

  const getItemRow = (onLabelClick?: () => void) => <>
    <div className="planItem">
      <span style={{ float: "right", display: "flex", alignItems: "center", gap: 4 }}>
        <Icon style={{ fontSize: 16, color: "#999" }}>schedule</Icon>
        <span style={{ color: "#666", fontSize: "0.9em", minWidth: 40, textAlign: "right" }}>
          {PlanHelper.formatTime(pi.seconds)}
        </span>
      </span>
      <div>{PlanHelper.formatTime(props.startTime || 0)}</div>
      <div>
        {onLabelClick ? (
          <a href="about:blank" onClick={(e) => { e.preventDefault(); onLabelClick(); }}>
            {pi.label}
          </a>
        ) : pi.link ? (
          <a href={pi.link} target="_blank" rel="noopener noreferrer">
            {pi.label}
          </a>
        ) : (
          pi.label
        )}
      </div>
      {getDescriptionRow()}
    </div>
  </>;

  const getPlanItem = () => {
    switch (pi.itemType) {
      case "header":
        return getHeaderRow();
      case "song":
      case "arrangementKey":
        return getItemRow(pi.relatedId ? () => setDialogKeyId(pi.relatedId) : undefined);
      // Action types (new provider + legacy)
      case "providerPresentation":
      case "lessonAction":
      case "action":
        return getItemRow(
          (pi.relatedId || hasProviderFields) ? () => setActionId(pi.relatedId || pi.providerContentPath || pi.id) : undefined
        );
      // File/add-on types (new provider + legacy)
      case "providerFile":
      case "lessonAddOn":
      case "addon":
      case "file":
        return getItemRow(
          (pi.relatedId || hasProviderFields) ? () => setActionId(pi.relatedId || pi.providerContentPath || pi.id) : undefined
        );
      // Section types (new provider + legacy)
      case "providerSection":
      case "lessonSection":
      case "section":
        return getItemRow(
          (pi.relatedId || hasProviderFields) ? () => setLessonSectionId(pi.relatedId || pi.providerContentPath || pi.id) : undefined
        );
      case "item":
      default:
        return getItemRow(pi.relatedId ? () => setLessonSectionId(pi.relatedId) : undefined);
    }
  };

  return (<>
    {getPlanItem()}
    {dialogKeyId && <SongDialog arrangementKeyId={dialogKeyId} onClose={() => { setDialogKeyId(null); }} />}
    {lessonSectionId && (
      <LessonDialog
        sectionId={lessonSectionId}
        sectionName={pi.label}
        onClose={() => { setLessonSectionId(null); }}
        providerId={pi.providerId}
        downloadUrl={pi.link}
        providerPath={pi.providerPath}
        providerContentPath={pi.providerContentPath}
        ministryId={props.ministryId}
      />
    )}
    {actionId && (
      <ActionDialog
        actionId={actionId}
        contentName={pi.label}
        onClose={() => { setActionId(null); }}
        providerId={pi.providerId || props.associatedProviderId}
        downloadUrl={pi.link}
        providerPath={pi.providerPath}
        providerContentPath={pi.providerContentPath}
        ministryId={props.ministryId}
      />
    )}
  </>);
};
