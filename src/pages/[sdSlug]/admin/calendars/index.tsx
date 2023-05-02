import { useEffect, useState } from "react";
import { B1Settings, DisplayBox, Loading } from "@/components";
import { GetStaticPaths, GetStaticProps } from "next";
import router from "next/router";
import { ApiHelper, ConfigHelper, WrapperPageProps } from "@/helpers";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { Grid, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import React from "react";
import { SmallButton } from "@/appBase/components";

export default function Calendars(props: WrapperPageProps) {
  const { isAuthenticated } = ApiHelper;
  /*
  const [calendars, setCalendars] = useState<CuratedCalendarInterface[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = () => {
    if (!isAuthenticated) router.push("/login");
    ApiHelper.get("/curatedCalendars", "ContentApi").then(data => { setCalendars(data); });
  }


  const getRows = () => {
    //var idx = 0;
    let rows: JSX.Element[] = [];
    calendars.forEach(calendar => {
      rows.push(
        <TableRow key={calendar.id}>
          <TableCell>{calendar.name}</TableCell>
          <TableCell style={{ textAlign: "right" }}>
            <a href="about:blank" onClick={(e: React.MouseEvent) => { e.preventDefault(); setCurrentSermon(video); }}><Icon>edit</Icon></a>
          </TableCell>
        </TableRow>
      );
      //idx++;
    })
    return rows;
  }

  const getTable = () => {
    if (isLoading) return <Loading />
    else return (<Table>
      <TableHead>
        <TableRow>
          <TableCell>Calendar</TableCell>
          <TableCell></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {getRows()}
      </TableBody>
    </Table>);
  }


  const getEditContent = () => (<>
    <SmallButton icon="add" />
  </>)


  React.useEffect(() => { loadData(); }, []);

  return (
    <AdminWrapper config={props.config}>
      <h1>Curated Calendars</h1>
      <Grid container spacing={3}>
        <Grid item md={8} xs={12}>
          <DisplayBox headerIcon="calendar_month" headerText="Curated Calendars" editContent={getEditContent()} id="calendarsBox">
            {getTable()}
          </DisplayBox>
        </Grid>
        <Grid item md={4} xs={12}>
          <h3>About Curated Calendars</h3>
          <p>Each group has it's own calendar which can be managed by group leaders from the group page. However, you can also create curated calendars which can be shared with the entire church.</p>
          <p>For example, you might want to create a calendar for all of the church's small groups, or a calendar for all of the church's youth events.  You may also wish to create a whole church events calendar which highlights the bigger events without including minor events from each group.</p>
          <p>You can create as many curated calendars as you like, and you can add events from any group to any curated calendar.</p>
        </Grid>
      </Grid>



    </AdminWrapper>
  );*/

  return <></>
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths:any[] = [];
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const config = await ConfigHelper.load(params.sdSlug.toString());
  return { props: { config }, revalidate: 30 };
};
