import React from "react";
import { Stack, Box, Typography } from "@mui/material";
import { ApiHelper, DisplayBox, SmallButton } from "@churchapps/apphelper";
import { PlanItem } from "./PlanItem";
import { PlanItemInterface, PlanInterface, ExternalVenueRefInterface } from "@/helpers";
import { LessonPreview } from "./LessonPreview";

interface Props {
  plan: PlanInterface
}

export const ServiceOrder = (props: Props) => {
  const [planItems, setPlanItems] = React.useState<PlanItemInterface[]>([]);
  const [previewLessonItems, setPreviewLessonItems] = React.useState<PlanItemInterface[]>([]);
  const [venueName, setVenueName] = React.useState<string>("");

  const hasAssociatedLesson = (props.plan?.contentType === "venue" || props.plan?.contentType === "externalVenue") && props.plan?.contentId;
  const isExternalVenue = props.plan?.contentType === "externalVenue";
  const showPreviewMode = hasAssociatedLesson && planItems.length === 0 && previewLessonItems.length > 0;

  const getExternalRef = (): ExternalVenueRefInterface | null => {
    if (!isExternalVenue || !props.plan?.contentId) return null;
    try {
      return JSON.parse(props.plan.contentId);
    } catch {
      return null;
    }
  };

  const externalRef = getExternalRef();

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
        let response;
        if (isExternalVenue && externalRef) {
          response = await ApiHelper.getAnonymous(
            `/externalProviders/${externalRef.externalProviderId}/venue/${externalRef.venueId}/planItems`,
            "LessonsApi"
          );
        } else {
          response = await ApiHelper.getAnonymous(`/venues/public/planItems/${props.plan.contentId}`, "LessonsApi");
        }
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

