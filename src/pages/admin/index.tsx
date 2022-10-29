import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Wrapper } from "@/components/Wrapper";
import { Grid } from "@mui/material";
import { ApiHelper } from "@/helpers";

export default function Admin() {
  const router = useRouter();
  const { isAuthenticated } = ApiHelper

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (isAuthenticated) { loadData(); } }, [isAuthenticated]);

  function loadData() {

  }

  return (
    <Wrapper>
      <h1>Programs</h1>

      <Grid container spacing={3}>
        <Grid item md={8} xs={12}>
          Preview Goes Here
        </Grid>
        <Grid item md={4} xs={12}>
          Edit Element Goes Here
        </Grid>
      </Grid>
    </Wrapper>
  );
}
