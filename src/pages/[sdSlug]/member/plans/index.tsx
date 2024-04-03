import { useState, useEffect } from "react";
import Link from "next/link";
import { Wrapper } from "@/components";
import { AssignmentInterface, ConfigHelper, PlanInterface, PositionInterface, TimeInterface, WrapperPageProps } from "@/helpers";
import { ApiHelper, ArrayHelper, DisplayBox, UserHelper } from "@churchapps/apphelper";
import { GetStaticPaths, GetStaticProps } from "next";
import { Grid, Icon, Table, TableBody, TableCell, TableRow } from "@mui/material";
import { ServingTimes } from "@/components/plans/ServingTimes";
import { UpcomingDates } from "@/components/plans/UpcomingDates";

export default function Groups(props: WrapperPageProps) {
  const [assignments, setAssignments] = useState<AssignmentInterface[]>([]);
  const [positions, setPositions] = useState<PositionInterface[]>([]);
  const [plans, setPlans] = useState<PlanInterface[]>([]);
  const [times, setTimes] = useState<TimeInterface[]>([]);

  const loadData = async () => {
    const tempAssignments:AssignmentInterface[] = await ApiHelper.get("/assignments/my", "DoingApi");

    if (tempAssignments.length > 0) {
      setAssignments(tempAssignments);
      const positionIds = ArrayHelper.getUniqueValues(tempAssignments, "positionId");
      const tempPositions = await ApiHelper.get("/positions/ids?ids=" + positionIds, "DoingApi");
      if (tempPositions.length > 0) {
        setPositions(tempPositions);
        const planIds = ArrayHelper.getUniqueValues(tempPositions, "planId");
        ApiHelper.get("/plans/ids?ids=" + planIds, "DoingApi").then((data) => setPlans(data));
        ApiHelper.get("/times/plans?planIds=" + planIds, "DoingApi").then((data) => setTimes(data));
      }
    }
  };

  useEffect(() => { loadData() }, []);

  if (!UserHelper.currentUserChurch?.person?.id) {
    return (
      <Wrapper config={props.config}>
        <h1>Plans</h1>
        <h3 className="text-center w-100">
          Please <Link href="/login/?returnUrl=/member/groups">Login</Link> to view your plans.
        </h3>
      </Wrapper>
    );
  }

  return (
    <Wrapper config={props.config}>
      <h1><Icon>assignment</Icon> Plans</h1>
      <Grid container spacing={3} alignItems="flex-start">
        <Grid item md={8} xs={12}>
          <ServingTimes assignments={assignments} plans={plans} positions={positions} />
        </Grid>
        <Grid item md={4} xs={12}>
          <UpcomingDates assignments={assignments} plans={plans} positions={positions} times={times} />
          <DisplayBox headerIcon="event" headerText="Upcoming Dates">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>Event</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </DisplayBox>
          <DisplayBox headerIcon="block" headerText="Block out Dates">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>Block Out Date</TableCell>
                  <TableCell>Reason</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </DisplayBox>
        </Grid>
      </Grid>




    </Wrapper>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths:any[] = [];
  return { paths, fallback: "blocking", };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const config = await ConfigHelper.load(params.sdSlug.toString());
  return { props: { config }, revalidate: 30 };
};
