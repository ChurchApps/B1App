import { useState } from "react";
import { Grid } from "@mui/material";
import { Tabs } from "./Tabs";
import { PageInterface } from "@/helpers";
import { UserHelper, Permissions } from "@churchapps/apphelper";
import { EmbeddablePages } from "../EmbeddablePages";
import { PageEdit } from "@/components/admin/PageEdit";

export function B1Settings() {
  const [editPage, setEditPage] = useState<PageInterface>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <Grid container spacing={3}>
      {UserHelper.checkAccess(Permissions.contentApi.content.edit)
        && <Grid item md={8} xs={12}>
          <EmbeddablePages onSelected={(page:PageInterface) => { setEditPage(page); } } pathPrefix="/member" refreshKey={refreshKey} />
        </Grid>
      }
      <Grid item md={4} xs={12}>
        {editPage && (<PageEdit page={editPage} updatedCallback={() => { setEditPage(null); setRefreshKey(Math.random()) }} embedded={true} /> )}
        {UserHelper.checkAccess(Permissions.contentApi.content.edit)
          && <Tabs updatedFunction={ () => {} } />
        }
      </Grid>
    </Grid>
  );
}
