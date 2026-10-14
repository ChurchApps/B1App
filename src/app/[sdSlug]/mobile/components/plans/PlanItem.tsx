"use client";
import React from "react";
import { Box, Typography } from "@mui/material";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import { PlanItemInterface, PlanHelper } from "@/helpers";
import { SongDialog } from "./SongDialog";
import { LessonDialog } from "./LessonDialog";
import { ActionDialog } from "./ActionDialog";
import { isAudioUrl } from "./ContentRenderer";
import { mobileTheme } from "../mobileTheme";
import { TextLink } from "../kit";

const tc = mobileTheme.colors;

interface Props {
  planItem: PlanItemInterface;
  startTime?: number;
  associatedProviderId?: string;
  associatedVenueId?: string;
  ministryId?: string;
  positionLabels?: Record<string, string>;
}

const muted = { fontSize: 13.5, lineHeight: "19px", color: tc.textSecondary, fontVariantNumeric: "tabular-nums", flex: "none" } as const;

export const PlanItem = (props: Props) => {
  const [dialogKeyId, setDialogKeyId] = React.useState<string | null>(null);
  const [lessonSectionId, setLessonSectionId] = React.useState<string | null>(null);
  const [actionId, setActionId] = React.useState<string | null>(null);

  const pi = props.planItem;
  const positionName = pi.positionId ? props.positionLabels?.[pi.positionId] : undefined;
  const hasProviderFields = pi.providerId && pi.providerPath && pi.providerContentPath;
  const isSong = pi.itemType === "song" || pi.itemType === "arrangementKey";

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
          positionLabels={props.positionLabels}
        />
      );
      cumulativeTime += c.seconds || 0;
    });
    return result;
  };

  const getHeaderRow = () => {
    const sectionDuration = PlanHelper.getSectionDuration(pi);
    return <>
      <Box sx={{ display: "flex", alignItems: "baseline", gap: "12px", pt: "14px", pb: "4px" }}>
        <Typography component="h3" sx={{ flex: 1, fontSize: 13, fontWeight: 650, letterSpacing: "0.05em", textTransform: "uppercase", color: tc.eyebrow }}>
          {pi.label}
          {positionName && <Box component="span" className="planItemPosition" sx={{ ...muted, ml: "8px", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>{positionName}</Box>}
        </Typography>
        {sectionDuration > 0 && <Box component="span" sx={muted}>{PlanHelper.formatTime(sectionDuration)}</Box>}
      </Box>
      {getChildren()}
    </>;
  };

  const getItemRow = (onLabelClick?: () => void) => {
    const label = <>{isSong && <MusicNoteIcon sx={{ fontSize: 16, color: tc.textSecondary }} />}{pi.label}</>;
    const linkSx = { whiteSpace: "normal", textAlign: "left", fontSize: 15, fontWeight: 500 } as const;
    return (
      <Box className="kit-row" sx={{ display: "flex", alignItems: "flex-start", gap: "12px", minHeight: 44, py: "10px", "& + .kit-row": { borderTop: `1px solid ${tc.border}` } }}>
        <Box component="span" sx={{ ...muted, width: 44, pt: "1px" }}>{PlanHelper.formatTime(props.startTime || 0)}</Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {onLabelClick ? (
            <TextLink onClick={onLabelClick} sx={linkSx}>{label}</TextLink>
          ) : pi.link ? (
            <TextLink href={pi.link} sx={linkSx}>{label}</TextLink>
          ) : (
            <Typography component="span" sx={{ display: "flex", alignItems: "center", gap: "6px", fontSize: 15, lineHeight: "21px", fontWeight: 500, color: tc.text, overflowWrap: "anywhere" }}>{label}</Typography>
          )}
          {pi.description && <Typography sx={{ fontSize: 13.5, lineHeight: "19px", color: tc.textSecondary, mt: "2px" }}>{pi.description}</Typography>}
          {positionName && <Typography className="planItemPosition" sx={{ fontSize: 13.5, lineHeight: "19px", color: tc.textSecondary, mt: "2px" }}>{positionName}</Typography>}
        </Box>
        <Box component="span" sx={{ ...muted, pt: "1px" }}>{PlanHelper.formatTime(pi.seconds || 0)}</Box>
      </Box>
    );
  };

  const getPlanItem = () => {
    switch (pi.itemType) {
      case "header":
        return getHeaderRow();
      case "song":
      case "arrangementKey":
        return getItemRow(pi.relatedId ? () => setDialogKeyId(pi.relatedId || null) : undefined);
      // Action types (new provider + legacy)
      case "providerPresentation":
      case "lessonAction":
      case "action":
        return getItemRow(
          (pi.relatedId || hasProviderFields) ? () => setActionId(pi.relatedId || pi.providerContentPath || pi.id || null) : undefined
        );
      // File/add-on types (new provider + legacy)
      case "providerFile":
      case "lessonAddOn":
      case "addon":
      case "file":
        return getItemRow(
          (pi.relatedId || hasProviderFields) ? () => setActionId(pi.relatedId || pi.providerContentPath || pi.id || null) : undefined
        );
      // Section types (new provider + legacy)
      case "providerSection":
      case "lessonSection":
      case "section":
        return getItemRow(
          (pi.relatedId || hasProviderFields) ? () => setLessonSectionId(pi.relatedId || pi.providerContentPath || pi.id || null) : undefined
        );
      case "item":
      default:
        // Audio links open the inline player dialog instead of downloading via the OS (issue #960)
        if (!pi.relatedId && pi.link && isAudioUrl(pi.link)) return getItemRow(() => setActionId(pi.id || null));
        return getItemRow(pi.relatedId ? () => setLessonSectionId(pi.relatedId || null) : undefined);
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
