"use client";
import React, { useState } from "react";
import { Box, Typography, Icon, Stack, Link } from "@mui/material";
import { PlanItemInterface, ExternalVenueRefInterface, PlanHelper } from "@/helpers";
import { ActionDialog } from "./ActionDialog";
import { LessonDialog } from "./LessonDialog";
import { mobileTheme } from "../mobileTheme";

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
    return (actionTypes.includes(item.itemType) || fileTypes.includes(item.itemType))
      && (item.relatedId || (item.providerId && item.providerPath && item.providerContentPath));
  };

  const isClickableSection = (item: PlanItemInterface) => {
    const sectionTypes = ["lessonSection", "providerSection", "section", "item"];
    return sectionTypes.includes(item.itemType)
      && (item.relatedId || (item.providerId && item.providerPath && item.providerContentPath));
  };

  const renderPreviewItem = (item: PlanItemInterface, isChild: boolean = false) => {
    if (item.itemType === "header") {
      const sectionDuration = PlanHelper.getSectionDuration(item);
      return (
        <Box key={item.id} sx={{ mb: 2 }}>
          <Box
            className="planItemHeader"
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 1,
              backgroundColor: `${tc.primary}14`,
              borderRadius: 1
            }}
          >
            <Typography sx={{ fontWeight: 700, color: tc.primary }}>{item.label}</Typography>
            {sectionDuration > 0 && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Icon sx={{ fontSize: 16, color: tc.primary }}>schedule</Icon>
                <Typography variant="body2" sx={{ color: tc.primary }}>
                  {PlanHelper.formatTime(sectionDuration)}
                </Typography>
              </Stack>
            )}
          </Box>
          {item.children?.map((child) => renderPreviewItem(child, true))}
        </Box>
      );
    }

    const clickable = isClickableAction(item) || isClickableSection(item);

    return (
      <Box
        key={item.id}
        className="planItem"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 1,
          pl: isChild ? 3 : 1,
          borderBottom: "1px solid",
          borderColor: tc.border
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
          {item.thumbnailUrl && (
            <Box
              component="img"
              src={item.thumbnailUrl}
              alt=""
              sx={{ width: 40, height: 24, objectFit: "cover", borderRadius: 0.5, flexShrink: 0 }}
            />
          )}
          <Box>
            {clickable ? (
              <Link
                href="#"
                onClick={(e) => isClickableAction(item) ? handleActionClick(e, item) : handleSectionClick(e, item)}
                variant="body2"
                sx={{ color: tc.primary, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
              >
                {item.label}
              </Link>
            ) : (
              <Typography variant="body2" sx={{ color: tc.text }}>{item.label}</Typography>
            )}
            {item.description && (
              <Typography variant="caption" sx={{ color: tc.textMuted, fontStyle: "italic", display: "block" }}>
                {item.description}
              </Typography>
            )}
          </Box>
        </Box>
        {item.seconds > 0 && (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Icon sx={{ fontSize: 16, color: tc.textSecondary }}>schedule</Icon>
            <Typography variant="body2" sx={{ color: tc.textSecondary }}>
              {PlanHelper.formatTime(item.seconds)}
            </Typography>
          </Stack>
        )}
      </Box>
    );
  };

  return (
    <>
      <Box sx={{ position: "relative" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="body2" sx={{ color: tc.textMuted }}>
            Lesson: {props.venueName}
          </Typography>
        </Box>
        <Box>
          {props.lessonItems.map((item) => renderPreviewItem(item))}
        </Box>
      </Box>
      {actionItem && (
        <ActionDialog
          actionId={actionItem.relatedId || actionItem.providerContentPath || actionItem.id}
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
          sectionId={sectionItem.relatedId || sectionItem.providerContentPath || sectionItem.id}
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
