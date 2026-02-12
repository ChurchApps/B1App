"use client";
import React, { useMemo } from "react";
import { Stack, Box, Typography, IconButton } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import { ApiHelper, DisplayBox } from "@churchapps/apphelper";
import { PlanItem } from "./PlanItem";
import { type PlanItemInterface, type PlanInterface, LessonsContentProvider } from "@churchapps/helpers";
import { getProvider, type InstructionItem, type IProvider, type Instructions } from "@churchapps/content-provider-helper";
import { LessonPreview } from "./LessonPreview";

interface Props {
  plan: PlanInterface
}

// Helper to find a thumbnail recursively through children
function findThumbnailRecursive(item: InstructionItem): string | undefined {
  if (item.thumbnail) return item.thumbnail;
  if (item.children) {
    for (const child of item.children) {
      const found = findThumbnailRecursive(child);
      if (found) return found;
    }
  }
  return undefined;
}

// Helper to convert InstructionItem to PlanItemInterface
function instructionToPlanItem(item: InstructionItem, providerId?: string, providerPath?: string, pathIndices: number[] = []): PlanItemInterface {
  let itemType = item.itemType || "item";
  if (itemType === "section") itemType = "providerSection";
  else if (itemType === "action") itemType = "providerPresentation";
  else if (itemType === "file") itemType = "providerFile";

  const contentPath = pathIndices.length > 0 ? pathIndices.join(".") : undefined;
  const thumbnail = findThumbnailRecursive(item);

  return {
    itemType,
    relatedId: item.relatedId,
    label: item.label || "",
    description: item.description,
    seconds: item.seconds ?? 0,
    providerId,
    providerPath,
    providerContentPath: contentPath,
    thumbnailUrl: thumbnail,
    children: item.children?.map((child, index) => instructionToPlanItem(child, providerId, providerPath, [...pathIndices, index]))
  };
}

// Helper to get instructions from provider
async function getProviderInstructions(provider: IProvider, path: string): Promise<Instructions | null> {
  if (provider.capabilities.instructions && provider.getInstructions) {
    return provider.getInstructions(path);
  }
  return null;
}

export const ServiceOrder = (props: Props) => {
  const [planItems, setPlanItems] = React.useState<PlanItemInterface[]>([]);
  const [previewLessonItems, setPreviewLessonItems] = React.useState<PlanItemInterface[]>([]);
  const [venueName, setVenueName] = React.useState<string>("");

  // Legacy Lessons.church provider
  const lessonsProvider = useMemo(() => new LessonsContentProvider(), []);
  const hasAssociatedLesson = lessonsProvider.hasAssociatedLesson(props.plan);
  const externalRef = lessonsProvider.getExternalRef(props.plan);

  // New provider-based association
  const provider: IProvider | null = useMemo(() => {
    if (props.plan?.providerId) return getProvider(props.plan.providerId);
    return null;
  }, [props.plan?.providerId]);

  const hasAssociatedContent = !!provider || hasAssociatedLesson;
  const showPreviewMode = hasAssociatedContent && planItems.length === 0 && previewLessonItems.length > 0;

  const loadData = async () => {
    if (props.plan?.id) {
      ApiHelper.get("/planItems/plan/" + props.plan.id.toString(), "DoingApi").then((d: PlanItemInterface[]) => {
        setPlanItems(d);
      });
    }
  };

  const loadPreviewLessonItems = async () => {
    if (!hasAssociatedContent || planItems.length !== 0) return;

    try {
      // New provider-based path
      if (provider && props.plan?.providerPlanId) {
        let instructions: Instructions | null = null;

        // Try client-side first
        if (!provider.requiresAuth) {
          instructions = await getProviderInstructions(provider, props.plan.providerPlanId);
        }

        // Fall back to API proxy
        if (!instructions) {
          try {
            instructions = await ApiHelper.post(
              "/providerProxy/getInstructions",
              { providerId: props.plan.providerId, path: props.plan.providerPlanId },
              "DoingApi"
            );
          } catch (proxyError) {
            console.warn("API proxy failed:", proxyError);
          }
        }

        if (instructions) {
          const items: PlanItemInterface[] = instructions.items.map((item, index) =>
            instructionToPlanItem(item, props.plan.providerId, props.plan.providerPlanId, [index])
          );
          setPreviewLessonItems(items);
          setVenueName(props.plan.providerPlanName || instructions.name || "");
          return;
        }
      }

      // Legacy Lessons.church path
      if (hasAssociatedLesson) {
        const response = await lessonsProvider.fetchVenuePlanItems(props.plan);
        setPreviewLessonItems(response?.items || []);
        if (response?.venueName) setVenueName(response.venueName);
      }
    } catch (error) {
      console.error("Error loading preview lesson items:", error);
      setPreviewLessonItems([]);
    }
  };

  const getEditContent = () => (
    <Stack direction="row">
      <IconButton
        onClick={() => window.open(`/my/plans/print/${props.plan?.id}`, "_blank")}
        size="small"
        data-testid="print-service-order-button"
      >
        <PrintIcon />
      </IconButton>
    </Stack>
  );

  React.useEffect(() => {
    loadData();
  }, []);

  React.useEffect(() => {
    loadPreviewLessonItems();
  }, [planItems.length, props.plan?.contentType, props.plan?.contentId, props.plan?.providerId, props.plan?.providerPlanId]);

  const renderContent = () => {
    if (planItems.length === 0 && showPreviewMode) {
      return (
        <LessonPreview
          lessonItems={previewLessonItems}
          venueName={venueName}
          externalRef={externalRef}
          associatedProviderId={props.plan?.providerId}
          associatedVenueId={props.plan?.providerPlanId}
          ministryId={props.plan?.ministryId}
        />
      );
    }
    if (planItems.length === 0) {
      return (
        <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
          <Typography variant="body1">No items in the order of service</Typography>
        </Box>
      );
    }
    let cumulativeTime = 0;
    return planItems.map((pi) => {
      const startTime = cumulativeTime;
      cumulativeTime += pi.seconds || 0;
      return (
        <PlanItem
          key={pi.id}
          planItem={pi}
          startTime={startTime}
          associatedProviderId={props.plan?.providerId}
          associatedVenueId={props.plan?.providerPlanId}
          ministryId={props.plan?.ministryId}
        />
      );
    });
  };

  return (
    <DisplayBox headerText="Order of Service" headerIcon="album" editContent={getEditContent()}>
      {renderContent()}
    </DisplayBox>
  );
};
