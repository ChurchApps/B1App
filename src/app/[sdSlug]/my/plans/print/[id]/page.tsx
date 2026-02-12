"use client";
import React, { useEffect, useState, useRef } from "react";
import { ApiHelper, DateHelper, ArrayHelper } from "@churchapps/apphelper";
import { type PlanInterface, type PlanItemInterface, type PositionInterface, type AssignmentInterface, type PersonInterface, PlanHelper, LessonsContentProvider } from "@churchapps/helpers";
import { getProvider, type InstructionItem, type IProvider, type Instructions } from "@churchapps/content-provider-helper";
import { Grid } from "@mui/material";

type Params = Promise<{ sdSlug: string; id: string }>;

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

async function fetchPreviewItems(planData: PlanInterface): Promise<PlanItemInterface[]> {
  try {
    if (planData?.providerId) {
      const provider: IProvider | null = getProvider(planData.providerId);
      if (provider && planData.providerPlanId) {
        let instructions: Instructions | null = null;

        if (!provider.requiresAuth && provider.capabilities.instructions && provider.getInstructions) {
          instructions = await provider.getInstructions(planData.providerPlanId);
        }

        if (!instructions) {
          try {
            instructions = await ApiHelper.post(
              "/providerProxy/getInstructions",
              { providerId: planData.providerId, path: planData.providerPlanId },
              "DoingApi"
            );
          } catch { /* fall through */ }
        }

        if (instructions) {
          return instructions.items.map((item, index) =>
            instructionToPlanItem(item, planData.providerId, planData.providerPlanId, [index])
          );
        }
      }
    }

    const lessonsProvider = new LessonsContentProvider();
    if (lessonsProvider.hasAssociatedLesson(planData)) {
      const response = await lessonsProvider.fetchVenuePlanItems(planData);
      return response?.items || [];
    }
  } catch (error) {
    console.error("Error loading preview items for print:", error);
  }
  return [];
}

export default function PrintPlanPage({ params }: { params: Params }) {
  const [planId, setPlanId] = useState<string>("");
  const [plan, setPlan] = useState<PlanInterface>(null);
  const [positions, setPositions] = useState<PositionInterface[]>([]);
  const [assignments, setAssignments] = useState<AssignmentInterface[]>([]);
  const [people, setPeople] = useState<PersonInterface[]>([]);
  const [displayItems, setDisplayItems] = useState<PlanItemInterface[]>([]);
  const [isPreview, setIsPreview] = useState(false);
  const [ready, setReady] = useState(false);
  const printTriggered = useRef(false);

  let totalSeconds = 0;

  useEffect(() => {
    params.then(({ id }) => {
      setPlanId(id);
    });
  }, [params]);

  const loadData = async () => {
    if (!planId) return;

    const [planData, positionData, planItemData, assignmentData] = await Promise.all([
      ApiHelper.get("/plans/" + planId, "DoingApi") as Promise<PlanInterface>,
      ApiHelper.get("/positions/plan/" + planId, "DoingApi") as Promise<PositionInterface[]>,
      ApiHelper.get("/planItems/plan/" + planId, "DoingApi") as Promise<PlanItemInterface[]>,
      ApiHelper.get("/assignments/plan/" + planId, "DoingApi") as Promise<AssignmentInterface[]>
    ]);

    setPlan(planData);
    setPositions(positionData);
    setAssignments(assignmentData);

    const peopleIds = ArrayHelper.getUniqueValues(assignmentData, "personId");
    if (peopleIds.length > 0) {
      const personData = await ApiHelper.get("/people/ids?ids=" + peopleIds.join(","), "MembershipApi") as PersonInterface[];
      setPeople(personData);
    }

    if (planItemData.length > 0) {
      setDisplayItems(planItemData);
      setReady(true);
      return;
    }

    // Autopopulate from provider or lesson if no saved items
    const previewItems = await fetchPreviewItems(planData);
    if (previewItems.length > 0) {
      setDisplayItems(previewItems);
      setIsPreview(true);
    }
    setReady(true);
  };

  useEffect(() => {
    if (planId) loadData();
  }, [planId]);

  useEffect(() => {
    if (ready && !printTriggered.current) {
      printTriggered.current = true;
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [ready]);

  const getPositionCategories = () => {
    const cats: string[] = [];
    positions.forEach((p) => {
      if (!cats.includes(p.categoryName)) cats.push(p.categoryName);
    });
    const result: React.ReactElement[] = [];
    cats.forEach((c) => {
      result.push(
        <div key={c}>
          <h3 style={{ marginTop: 15, marginBottom: 5 }}>{c}</h3>
          {getPositions(c)}
        </div>
      );
    });
    return result;
  };

  const getPositions = (categoryName: string) => {
    const result: React.ReactElement[] = [];
    positions
      .filter((p) => p.categoryName === categoryName)
      .forEach((p) => {
        const names: string[] = [];
        assignments
          .filter((a) => a.positionId === p.id)
          .forEach((a) => {
            const person = people.find((per) => per.id === a.personId);
            names.push(person?.name?.display);
          });

        result.push(
          <div key={p.id}>
            <b>{p.name}:</b> {names.join(", ")}
          </div>
        );
      });
    return result;
  };

  const getPlanItems = (items: PlanItemInterface[]) => {
    let result: React.ReactElement[] = [];
    items.forEach((pi) => {
      if (pi.itemType === "header") {
        result.push(
          <tr key={pi.id || `header-${pi.label}`}>
            <td colSpan={3} style={{ ...Styles.tableCell, backgroundColor: "#eee", fontWeight: "bold", paddingTop: 10 }}>
              {pi.label}
            </td>
          </tr>
        );
      } else {
        result.push(
          <tr key={pi.id || `item-${totalSeconds}`}>
            <td style={Styles.tableCell}>{PlanHelper.formatTime(totalSeconds)}</td>
            <td style={Styles.tableCell}>
              <b>{pi.label}</b>{pi.description ? <>: {pi.description}</> : null}
            </td>
            <td style={{ ...Styles.tableCell, textAlign: "right" }}>{PlanHelper.formatTime(pi.seconds)}</td>
          </tr>
        );
        totalSeconds += pi.seconds || 0;
      }
      if (pi.children) result = result.concat(getPlanItems(pi.children));
    });
    return result;
  };

  const Styles: Record<string, React.CSSProperties> = {
    body: {
      padding: "20px",
      backgroundColor: "#FFF",
      color: "#000",
      minHeight: "100vh"
    },
    header: { fontWeight: "bold", textAlign: "center", padding: 5 },
    inverseHeader: {
      backgroundColor: "#000",
      color: "#FFF",
      textAlign: "center",
      padding: 5,
      fontWeight: "bold"
    },
    divider: { borderBottom: "20px solid #000" },
    tableCell: { verticalAlign: "top", padding: 5, textAlign: "left" }
  };

  if (!plan) {
    return <div style={{ padding: 20, textAlign: "center" }}>Loading...</div>;
  }

  return (
    <div style={Styles.body} className="printBackgrounds">
      <Grid container>
        <Grid size={{ xs: 4 }} style={Styles.inverseHeader}>
            Service Order
        </Grid>
        <Grid size={{ xs: 4 }} style={{ ...Styles.header, borderTop: "5px solid #000" }}>
          {plan?.serviceDate && DateHelper.prettyDate(DateHelper.toDate(plan.serviceDate))}
        </Grid>
        <Grid size={{ xs: 4 }} style={Styles.inverseHeader}>
            Service Order
        </Grid>
      </Grid>
      <div style={Styles.divider}>&nbsp;</div>
      {isPreview && (
        <div style={{ textAlign: "center", padding: "8px 0", color: "#666", fontSize: "0.9em", fontStyle: "italic" }}>
          Preview from associated lesson
        </div>
      )}
      <Grid container>
        <Grid size={{ xs: 4 }} style={{ padding: 5 }}>
          <div style={{ border: "2px solid #000", textAlign: "left", padding: 10 }}>{getPositionCategories()}</div>
        </Grid>
        <Grid size={{ xs: 8 }} style={{ padding: 5 }}>
          <div style={{ border: "5px solid #000" }}>
            <table style={{ width: "100%", margin: 0 }} cellSpacing={0}>
              <thead>
                <tr style={Styles.inverseHeader}>
                  <td style={{ textAlign: "left", paddingLeft: 10 }}>Time</td>
                  <td></td>
                  <td style={{ textAlign: "right", paddingRight: 10 }}>Length</td>
                </tr>
              </thead>
              <tbody>
                {getPlanItems(displayItems)}
              </tbody>
            </table>
          </div>
        </Grid>
      </Grid>
    </div>
  );
}
