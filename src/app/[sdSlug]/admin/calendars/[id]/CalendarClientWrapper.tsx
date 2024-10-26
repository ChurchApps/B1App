"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Typography, Grid, Table, TableBody, TableRow, TableCell, Tooltip, IconButton } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import { EnvironmentHelper, WrapperPageProps } from "@/helpers";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { DisplayBox, Loading, ApiHelper, CuratedCalendarInterface, GroupInterface, CuratedEventInterface } from "@churchapps/apphelper";
import { CuratedCalendar } from "@/components/admin/calendar/CuratedCalendar";

export function CalendarClientWrapper(props: WrapperPageProps) {
    const { isAuthenticated } = ApiHelper;
    EnvironmentHelper.initLocale();
    const [currentCalendar, setCurrentCalendar] = useState<CuratedCalendarInterface>(null);
    const [groups, setGroups] = useState<GroupInterface[]>([]);
    const [isLoadingGroups, setIsLoadingGroups] = useState<boolean>(false);
    const [events, setEvents] = useState<CuratedEventInterface[]>([]);
    const [refresh, refresher] = useState({});


    const searchparams = useSearchParams()
    const router = useRouter();
    const curatedCalendarId = searchparams.get("query.id")
    // const curatedCalendarId = router.query?.id;

    const loadData = () => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }
        ApiHelper.get("/curatedCalendars/" + curatedCalendarId, "ContentApi").then((data) => setCurrentCalendar(data));

        setIsLoadingGroups(true);
        ApiHelper.get("/groups/my", "MembershipApi").then((data) => {
            setGroups(data);
            setIsLoadingGroups(false);
        });

        ApiHelper.get("/curatedEvents/calendar/" + curatedCalendarId + "?withoutEvents=1", "ContentApi").then((data: CuratedEventInterface[]) => {
            setEvents(data);
        });
    };

    const handleGroupDelete = (groupId: string) => {
        if (confirm("Are you sure you wish to delete this group?")) {
            ApiHelper.delete("/curatedEvents/calendar/" + curatedCalendarId + "/group/" + groupId, "ContentApi").then(() => {
                loadData();
                refresher({});
            });
        }
    };

    const addedGroups = groups.filter((g) => events.find((event) => event.groupId === g.id));

    const getRows = () => {
        let rows: JSX.Element[] = [];

        if (addedGroups.length === 0) {
            rows.push(
                <TableRow key="0">
                    <TableCell>No Groups Found.</TableCell>
                </TableRow>
            );
        }

        addedGroups.map((g, index) => {
            rows.push(
                <TableRow key={index}>
                    <TableCell>{g.name}</TableCell>
                    <TableCell>
                        <Tooltip title="Remove Group" arrow>
                            <IconButton color="primary" size="small" onClick={() => handleGroupDelete(g.id)}>
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    </TableCell>
                </TableRow>
            );
        });

        return rows;
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <AdminWrapper config={props.config}>
            <h1>{currentCalendar?.name}</h1>
            <Grid container spacing={3}>
                <Grid item md={9} xs={12}>
                    <DisplayBox headerText="">
                        <Typography component="h2" variant="h6" color="primary">Curated Calendar</Typography>
                        <CuratedCalendar curatedCalendarId={curatedCalendarId as string} churchId={props.config.church.id} mode="edit" updatedCallback={loadData} refresh={refresh} />
                    </DisplayBox>
                </Grid>
                <Grid item md={3} xs={12}>
                    <DisplayBox headerText="Groups" headerIcon="backup_table">
                        {isLoadingGroups ? (
                            <Loading />
                        ) : (
                            <Table size="small">
                                <TableBody>{getRows()}</TableBody>
                            </Table>
                        )}
                    </DisplayBox>
                </Grid>
            </Grid>
        </AdminWrapper>
    );
}
