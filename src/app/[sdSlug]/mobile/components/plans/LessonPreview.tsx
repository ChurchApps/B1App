"use client";
import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import { Locale } from "@churchapps/apphelper";
import { PlanItemInterface, ExternalVenueRefInterface, PlanHelper } from "@/helpers";
import { ActionDialog } from "./ActionDialog";
import { LessonDialog } from "./LessonDialog";
import { mobileTheme } from "../mobileTheme";
import { TextLink, Thumb } from "../kit";

interface Props {
  lessonItems: PlanItemInterface[];
  venueName: string;
  externalRef?: ExternalVenueRefInterface | null;
  associatedProviderId?: string;
  associatedVenueId?: string;
  ministryId?: string;
}

export const LessonPreview: React.FC<Props> = (props) => {
  const tc = mobileTheme.colors;
  const [actionItem, setActionItem] = useState<PlanItemInterface | null>(null);
  const [sectionItem, setSectionItem] = useState<PlanItemInterface | null>(null);

  const handleActionClick = (e: React.MouseEvent, item: PlanItemInterface) => {
    e.preventDefault();
    if (item.relatedId || (item.providerId && item.providerPath && item.providerContentPath)) {
      setActionItem(item);
    }
  };

  const handleSectionClick = (e: React.MouseEvent, item: PlanItemInterface) => {
    e.preventDefault();
    if (item.relatedId || (item.providerId && item.providerPath && item.providerContentPath)) {
      setSectionItem(item);
    }
  };

  const isClickableAction = (item: PlanItemInterface) => {
    const actionTypes = ["lessonAction", "providerPresentation", "action"];
    const fileTypes = ["lessonAddOn", "providerFile", "addon", "file"];
    return (actionTypes.includes(item.itemType || "") || fileTypes.includes(item.itemType || ""))
      && (item.relatedId || (item.providerId && item.providerPath && item.providerContentPath));
  };

  const isClickableSection = (item: PlanItemInterface) => {
    const sectionTypes = ["lessonSection", "providerSection", "section", "item"];
    return sectionTypes.includes(item.itemType || "")
      && (item.relatedId || (item.providerId && item.providerPath && item.providerContentPath));
  };

  const renderPreviewItem = (item: PlanItemInterface, isChild: boolean = false) => {
    if (item.itemType === "header") {
      const sectionDuration = PlanHelper.getSectionDuration(item);
      return (
        <Box key={item.id} sx={{ "& + &": { mt: "12px" } }}>
          <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px", pb: "4px" }}>
            <Typography component="h3" sx={{ fontSize: 13, fontWeight: 650, letterSpacing: "0.05em", textTransform: "uppercase", color: tc.eyebrow }}>{item.label}</Typography>
            {sectionDuration > 0 && <Typography sx={{ fontSize: 13.5, color: tc.textSecondary, fontVariantNumeric: "tabular-nums" }}>{PlanHelper.formatTime(sectionDuration)}</Typography>}
          </Box>
          {item.children?.map((child, i) => <React.Fragment key={child.id || `child-${i}`}>{renderPreviewItem(child, true)}</React.Fragment>)}
        </Box>
      );
    }

    const clickable = isClickableAction(item) || isClickableSection(item);

    return (
      <Box
        key={item.id}
        className="kit-row"
        sx={{ display: "flex", alignItems: "center", gap: "12px", minHeight: 44, py: "8px", pl: isChild ? "8px" : 0, "& + .kit-row": { borderTop: `1px solid ${tc.border}` } }}
      >
        {item.thumbnailUrl && <Thumb src={item.thumbnailUrl} width={48} height={28} />}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {clickable ? (
            <TextLink
              onClick={(e) => isClickableAction(item) ? handleActionClick(e, item) : handleSectionClick(e, item)}
              sx={{ whiteSpace: "normal", textAlign: "left", fontSize: 15, fontWeight: 500 }}
            >
              {item.label}
            </TextLink>
          ) : (
            <Typography sx={{ fontSize: 15, color: tc.text }}>{item.label}</Typography>
          )}
          {item.description && <Typography sx={{ fontSize: 13.5, color: tc.textSecondary }}>{item.description}</Typography>}
        </Box>
        {(item.seconds || 0) > 0 && (
          <Typography sx={{ fontSize: 13.5, color: tc.textSecondary, fontVariantNumeric: "tabular-nums", flex: "none" }}>{PlanHelper.formatTime(item.seconds || 0)}</Typography>
        )}
      </Box>
    );
  };

  return (
    <>
      <Box>
        {props.venueName && <Typography sx={{ fontSize: 13.5, color: tc.textSecondary, mb: "8px" }}>{Locale.label("mobile.serving.lessonName").replace("{}", props.venueName)}</Typography>}
        {props.lessonItems.map((item, i) => <React.Fragment key={item.id || `lesson-${i}`}>{renderPreviewItem(item)}</React.Fragment>)}
      </Box>
      {actionItem && (
        <ActionDialog
          actionId={actionItem.relatedId || actionItem.providerContentPath || actionItem.id || ""}
          contentName={actionItem.label}
          externalRef={props.externalRef}
          onClose={() => setActionItem(null)}
          providerId={actionItem.providerId || props.associatedProviderId}
          downloadUrl={actionItem.link}
          providerPath={actionItem.providerPath}
          providerContentPath={actionItem.providerContentPath}
          ministryId={props.ministryId}
        />
      )}
      {sectionItem && (
        <LessonDialog
          sectionId={sectionItem.relatedId || sectionItem.providerContentPath || sectionItem.id || ""}
          sectionName={sectionItem.label}
          externalRef={props.externalRef}
          onClose={() => setSectionItem(null)}
          providerId={sectionItem.providerId}
          downloadUrl={sectionItem.link}
          providerPath={sectionItem.providerPath}
          providerContentPath={sectionItem.providerContentPath}
          ministryId={props.ministryId}
        />
      )}
    </>
  );
};
