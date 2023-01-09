import { useState, useEffect, useContext } from "react";
import { Grid } from "@mui/material";
import { PageList } from "./PageList";
import { Tabs } from "./Tabs";
import { PageEdit } from "./PageEdit";
import { B1PageInterface, ApiHelper, UserHelper, ConfigHelper } from "@/helpers";
import UserContext from "@/context/UserContext";

export function B1Settings() {
  const [pages, setPages] = useState<B1PageInterface[]>([]);
  const [currentPage, setCurrentPage] = useState<B1PageInterface>(null);
  const context = useContext(UserContext);

  const loadData = () => {
    ApiHelper.get("/pages", "B1Api").then((data) => setPages(data));
  };

  const loadPage = (pageId: string) => {
    ApiHelper.get("/pages/" + pageId + "?include=content", "B1Api").then((data) => setCurrentPage(data));
  };

  useEffect(loadData, []);

  const handleAdd = () => {
    setCurrentPage({ churchId: UserHelper.currentUserChurch.church.id, lastModified: new Date(), name: "" });
  };

  const handleEdit = (page: B1PageInterface) => {
    loadPage(page.id);
  };

  const handleUpdate = () => {
    const keyName = window.location.hostname.split(".")[0];
    ConfigHelper.load(keyName).then(() => {
      setCurrentPage(null);
      loadData();
      context.setUser({ ...context.user }); // hacky stuff to create navbar re-render.
    });
  };

  return (
    <Grid container spacing={3}>
      <Grid item md={8} xs={12}>
        <PageList pages={pages} addFunction={handleAdd} editFunction={handleEdit} />
      </Grid>
      <Grid item md={4} xs={12}>
        <Tabs updatedFunction={handleUpdate} />
        {currentPage !== null ? <PageEdit page={currentPage} updatedFunction={handleUpdate} /> : null}
      </Grid>
    </Grid>
  );
}
