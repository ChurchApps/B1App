"use client";
import React, { useEffect, useState } from "react";
import { ApiHelper, DateHelper, ArrayHelper } from "@churchapps/apphelper";
import { type PlanInterface, type PlanItemInterface, type PositionInterface, type AssignmentInterface, type PersonInterface, PlanHelper } from "@churchapps/helpers";
import { Grid } from "@mui/material";

type Params = Promise<{ sdSlug: string; id: string }>;

export default function PrintPlanPage({ params }: { params: Params }) {
  const [planId, setPlanId] = useState<string>("");
  const [plan, setPlan] = useState<PlanInterface>(null);
  const [positions, setPositions] = useState<PositionInterface[]>([]);
  const [assignments, setAssignments] = useState<AssignmentInterface[]>([]);
  const [people, setPeople] = useState<PersonInterface[]>([]);
  const [planItems, setPlanItems] = useState<PlanItemInterface[]>([]);

  let totalSeconds = 0;

  useEffect(() => {
    params.then(({ id }) => {
      setPlanId(id);
    });
  }, [params]);

  const loadData = async () => {
    if (!planId) return;

    ApiHelper.get("/plans/" + planId, "DoingApi").then((data: PlanInterface) => {
      setPlan(data);
    });
    ApiHelper.get("/positions/plan/" + planId, "DoingApi").then((data: PositionInterface[]) => {
      setPositions(data);
    });
    ApiHelper.get("/planItems/plan/" + planId, "DoingApi").then((d: PlanItemInterface[]) => {
      setPlanItems(d);
    });

    const d = await ApiHelper.get("/assignments/plan/" + planId, "DoingApi");
    setAssignments(d);
    const peopleIds = ArrayHelper.getUniqueValues(d, "personId");
    if (peopleIds.length > 0) {
      ApiHelper.get("/people/ids?ids=" + peopleIds.join(","), "MembershipApi").then((data: PersonInterface[]) => {
        setPeople(data);
      });
    }

    setTimeout(() => {
      window.print();
    }, 1000);
  };

  useEffect(() => {
    if (planId) loadData();
  }, [planId]);

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
      if (pi.itemType !== "header") {
        result.push(
          <tr key={pi.id}>
            <td style={Styles.tableCell}>{PlanHelper.formatTime(totalSeconds)}</td>
            <td style={Styles.tableCell}>
              <b>{pi.label}:</b> {pi.description}
            </td>
            <td style={{ ...Styles.tableCell, textAlign: "right" }}>{PlanHelper.formatTime(pi.seconds)}</td>
          </tr>
        );
        totalSeconds += pi.seconds;
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
                {getPlanItems(planItems)}
              </tbody>
            </table>
          </div>
        </Grid>
      </Grid>
    </div>
  );
}
