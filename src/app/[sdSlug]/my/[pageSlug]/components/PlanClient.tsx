"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Grid, Icon } from "@mui/material";
import { ApiHelper, ArrayHelper, AssignmentInterface, DisplayBox, Loading, PersonInterface, PlanInterface, PositionInterface, TimeInterface, UserHelper } from "@churchapps/apphelper";
import { Team } from "@/components/plans/Team";
import { PositionDetails } from "@/components/plans/PositionDetails";

interface Props  {
  planId: string;
}

export function PlanClient({ planId }: Props) {
  const [plan, setPlan] = useState<PlanInterface>(null);
  const [positions, setPositions] = useState<PositionInterface[]>([]);
  const [assignments, setAssignments] = useState<AssignmentInterface[]>([]);
  const [times, setTimes] = useState<TimeInterface[]>([]);
  const [people, setPeople] = useState<PersonInterface[]>([]);
  const [isLoading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const tempPlan = await ApiHelper.get("/plans/" + planId, "DoingApi");
    ApiHelper.get("/times/plan/" + planId, "DoingApi").then((data) => setTimes(data));
    setPlan(tempPlan);
    const tempPositions = await ApiHelper.get("/positions/plan/" + planId, "DoingApi");
    const tempAssignments = await ApiHelper.get("/assignments/plan/" + planId, "DoingApi");
    const peopleIds = ArrayHelper.getIds(tempAssignments, "personId");
    const tempPeople = await ApiHelper.get("/people/basic?ids=" + escape(peopleIds.join(",")), "MembershipApi");

    setPositions(tempPositions);
    setAssignments(tempAssignments);
    setPeople(tempPeople);
    setLoading(false);
  };

  const getTeams = () => {
    const rows: JSX.Element[] = [];
    ArrayHelper.getUniqueValues(positions, "categoryName").forEach((category) => {
      const pos = ArrayHelper.getAll(positions, "categoryName", category);
      rows.push(<Team positions={pos} assignments={assignments} people={people} name={category} />);
    });
    return rows;
  };

  const getPositionDetails = () => {
    const rows: JSX.Element[] = [];
    const myAssignments = ArrayHelper.getAll(assignments, "personId", UserHelper.currentUserChurch.person.id);
    myAssignments.forEach((assignment) => {
      const position = ArrayHelper.getOne(positions, "id", assignment.positionId);
      const posTimes: TimeInterface[] = [];
      times.forEach((time) => {
        if (time.teams?.indexOf(position.categoryName) > -1) posTimes.push(time);
      });
      rows.push(<PositionDetails position={position} assignment={assignment} times={posTimes} onUpdate={loadData} />);
    });
    return rows;
  };

  const getNotes = () => {
    if (!plan?.notes) return null;
    return (
      <DisplayBox headerText="Notes">
        {plan.notes.replace("\n", "<br />")}
      </DisplayBox>
    );
  };

  useEffect(() => {
    loadData();
  }, [planId]);

  if (!UserHelper.currentUserChurch?.person?.id)
    return (
      <>
        <h1>Group</h1>
        <h3 className="text-center w-100">
          Please <Link href={`/login/?returnUrl=/my/plans/${planId}`}>Login</Link> to view your plans.
        </h3>
      </>
    );

  if (isLoading || !plan) return <Loading />;
  return (
    <>
      <h1>
        <Icon>assignment</Icon> {plan.name}
      </h1>
      <Grid container spacing={3} alignItems="flex-start">
        <Grid item md={8} xs={12}>
          {getPositionDetails()}
          {getNotes()}
        </Grid>
        <Grid item md={4} xs={12}>
          {getTeams()}
        </Grid>
      </Grid>
    </>
  );
}
