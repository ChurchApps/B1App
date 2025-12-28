"use client";
import React, { useState } from "react";
import { Box, Typography, Icon, Stack, Link } from "@mui/material";
import { PlanItemInterface, ExternalVenueRefInterface, PlanHelper } from "@/helpers";
import { ActionDialog } from "./ActionDialog";
import { LessonDialog } from "./LessonDialog";

interface Props {
  lessonItems: PlanItemInterface[];
  venueName: string;
  externalRef?: ExternalVenueRefInterface | null;
}

export const LessonPreview: React.FC<Props> = (props) => {
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionName, setActionName] = useState<string>("");
  const [lessonSectionId, setLessonSectionId] = useState<string | null>(null);
  const [sectionName, setSectionName] = useState<string>("");

  const handleActionClick = (e: React.MouseEvent, item: PlanItemInterface) => {
    e.preventDefault();
    if (item.relatedId) {
      setActionId(item.relatedId);
      setActionName(item.label || "");
    }
  };

  const handleSectionClick = (e: React.MouseEvent, item: PlanItemInterface) => {
    e.preventDefault();
    if (item.relatedId) {
      setLessonSectionId(item.relatedId);
      setSectionName(item.label || "");
    }
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
              backgroundColor: "grey.100",
              borderRadius: 1,
            }}
          >
            <Typography sx={{ fontWeight: 600 }}>{item.label}</Typography>
            {sectionDuration > 0 && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Icon sx={{ fontSize: 16, color: "grey.500" }}>schedule</Icon>
                <Typography variant="body2" sx={{ color: "grey.600" }}>
                  {PlanHelper.formatTime(sectionDuration)}
                </Typography>
              </Stack>
            )}
          </Box>
          {item.children?.map((child) => renderPreviewItem(child, true))}
        </Box>
      );
    }

    const isAction = item.itemType === "lessonAction" && item.relatedId;
    const isLessonSection = item.itemType === "item" && item.relatedId;

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
          borderColor: "grey.200",
        }}
      >
        <Box>
          {isAction ? (
            <Link
              href="#"
              onClick={(e) => handleActionClick(e, item)}
              variant="body2"
              sx={{ textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
            >
              {item.label}
            </Link>
          ) : isLessonSection ? (
            <Link
              href="#"
              onClick={(e) => handleSectionClick(e, item)}
              variant="body2"
              sx={{ textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
            >
              {item.label}
            </Link>
          ) : (
            <Typography variant="body2">{item.label}</Typography>
          )}
          {item.description && (
            <Typography variant="caption" sx={{ color: "grey.600", fontStyle: "italic", display: "block" }}>
              {item.description}
            </Typography>
          )}
        </Box>
        {item.seconds > 0 && (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Icon sx={{ fontSize: 16, color: "grey.500" }}>schedule</Icon>
            <Typography variant="body2" sx={{ color: "grey.600" }}>
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
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Lesson: {props.venueName}
          </Typography>
        </Box>

        <Box>
          {props.lessonItems.map((item) => renderPreviewItem(item))}
        </Box>
      </Box>
      {actionId && <ActionDialog actionId={actionId} actionName={actionName} externalRef={props.externalRef} onClose={() => setActionId(null)} />}
      {lessonSectionId && <LessonDialog sectionId={lessonSectionId} sectionName={sectionName} externalRef={props.externalRef} onClose={() => setLessonSectionId(null)} />}
    </>
  );
};
