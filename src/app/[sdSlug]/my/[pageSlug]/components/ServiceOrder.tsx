import React, { useMemo } from "react";
import { Stack, Box, Typography } from "@mui/material";
import { ApiHelper, DisplayBox, SmallButton } from "@churchapps/apphelper";
import { PlanItem } from "./PlanItem";
import { type PlanItemInterface, type PlanInterface, LessonsContentProvider } from "@churchapps/helpers";
import { LessonPreview } from "./LessonPreview";

interface Props {
  plan: PlanInterface
}

export const ServiceOrder = (props: Props) => {
  const [planItems, setPlanItems] = React.useState<PlanItemInterface[]>([]);
  const [previewLessonItems, setPreviewLessonItems] = React.useState<PlanItemInterface[]>([]);
  const [venueName, setVenueName] = React.useState<string>("");

  // Use LessonsContentProvider from helpers
  const lessonsProvider = useMemo(() => new LessonsContentProvider(), []);
  const hasAssociatedLesson = lessonsProvider.hasAssociatedLesson(props.plan);
  const externalRef = lessonsProvider.getExternalRef(props.plan);
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
        const response = await lessonsProvider.fetchVenuePlanItems(props.plan);
        setPreviewLessonItems(response?.items || []);
        if (response?.venueName) setVenueName(response.venueName);
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
      return <LessonPreview lessonItems={previewLessonItems} venueName={venueName} externalRef={externalRef} />;
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
