"use client";

import React, { useContext, useState } from "react";
import { Box, Skeleton } from "@mui/material";
import { Locale } from "@churchapps/apphelper";
import type { TaskInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { BackVerb, PageHead, Plate, PlateSection, QuietEmpty, RowList, SignInPrompt } from "../kit";
import { useMyCards, useMyTasks } from "../../helpers/myRecords";
import { MyTaskSheet, TaskRow } from "./CardSheet";

interface Props {
  config: ConfigurationInterface;
}

export const MyTasksPage = (_props: Props) => {
  const context = useContext(UserContext);
  const loggedIn = !!context?.user?.firstName;
  const personId = context?.person?.id || context?.userChurch?.person?.id;
  const { data: cards = [], isLoading: cardsLoading } = useMyCards(loggedIn);
  const { data: tasks = [], isLoading: tasksLoading } = useMyTasks(personId, loggedIn);
  const [open, setOpen] = useState<TaskInterface | null>(null);
  const loading = cardsLoading || tasksLoading;

  if (!loggedIn) return <SignInPrompt title={Locale.label("mobile.me.tasksSignedOutTitle")} lede={Locale.label("mobile.me.tasksSignedOutBody")} />;

  return (
    <Box sx={{ pb: "24px" }}>
      <BackVerb label={Locale.label("mobile.me.backToMe")} href="/mobile/me" />
      <PageHead title={Locale.label("mobile.screenTitles.myTasks")} />
      <Plate>
        {loading && <PlateSection>{[0, 1, 2].map((i) => <Skeleton key={i} variant="text" height={44} />)}</PlateSection>}
        {!loading && cards.length + tasks.length === 0 && <PlateSection><QuietEmpty>{Locale.label("mobile.me.noAssignments")}</QuietEmpty></PlateSection>}
        {!loading && cards.length > 0 && (
          <PlateSection title={Locale.label("mobile.card.cards")}>
            <RowList>{cards.map((t) => <TaskRow key={t.id} task={t} onOpen={setOpen} />)}</RowList>
          </PlateSection>
        )}
        {!loading && tasks.length > 0 && (
          <PlateSection title={Locale.label("mobile.card.tasks")}>
            <RowList>{tasks.map((t) => <TaskRow key={t.id} task={t} onOpen={setOpen} />)}</RowList>
          </PlateSection>
        )}
      </Plate>
      <MyTaskSheet task={open} onClose={() => setOpen(null)} />
    </Box>
  );
};

export default MyTasksPage;
