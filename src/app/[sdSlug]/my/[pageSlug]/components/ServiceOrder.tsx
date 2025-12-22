import React from "react";
import { Stack, Box, Typography } from "@mui/material";
import { ApiHelper, DisplayBox, SmallButton } from "@churchapps/apphelper";
import { PlanItem } from "./PlanItem";
import { PlanItemInterface, PlanInterface } from "@/helpers";
import { LessonPreview } from "./LessonPreview";

interface Props {
  plan: PlanInterface
}

export const ServiceOrder = (props: Props) => {
  const [planItems, setPlanItems] = React.useState<PlanItemInterface[]>([]);
  const [previewLessonItems, setPreviewLessonItems] = React.useState<PlanItemInterface[]>([]);
  const [venueName, setVenueName] = React.useState<string>("");

  const hasAssociatedLesson = props.plan?.contentType === "venue" && props.plan?.contentId;
  const showPreviewMode = hasAssociatedLesson && planItems.length === 0 && previewLessonItems.length > 0;

  const loadData = async () => {
    if (props.plan?.id) {
      ApiHelper.get("/planItems/plan/" + props.plan.id.toString(), "DoingApi").then((d: PlanItemInterface[]) => {
        setPlanItems(d);
      });
    }
  }

  const loadPreviewLessonItems = async () => {
    if (hasAssociatedLesson && planItems.length === 0) {
      try {
        const response = await ApiHelper.getAnonymous(`/venues/public/planItems/${props.plan.contentId}`, "LessonsApi");
        // Handle both new format { venueName, items } and old format (array)
        const items = Array.isArray(response) ? response : (response?.items || []);
        const venue = Array.isArray(response) ? "" : (response?.venueName || "");
        setPreviewLessonItems(items);
        if (venue) setVenueName(venue);
      } catch (error) {
        console.error("Error loading preview lesson items:", error);
        setPreviewLessonItems([]);
      }
    }
  }

  const getEditContent = () => (
    <Stack direction="row">
      <SmallButton href={"/plans/print/" + props.plan?.id} icon="print" data-testid="print-service-order-button" />
    </Stack>
  )

  React.useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    loadPreviewLessonItems();
  }, [planItems.length, props.plan?.contentType, props.plan?.contentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderContent = () => {
    if (planItems.length === 0 && showPreviewMode) {
      return <LessonPreview lessonItems={previewLessonItems} venueName={venueName} />;
    }
    if (planItems.length === 0) {
      return (
        <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
          <Typography variant="body1">No items in the order of service</Typography>
        </Box>
      );
    }
    return planItems.map((pi) => <PlanItem key={pi.id} planItem={pi} />);
  };

  return (
    <DisplayBox headerText="Order of Service" headerIcon="album" editContent={getEditContent()}>
      {renderContent()}
    </DisplayBox>
  );
};

