"use client";

import { Layout } from "@/components";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { LogoutPage } from "@churchapps/apphelper";
import { Container } from "@mui/material";

export default function Logout() {
  EnvironmentHelper.init();

  return (
    <Layout>
      <div style={{minHeight:500}}>
        <Container fixed>
          <h1>Logging out</h1>
        </Container>
        <LogoutPage />
      </div>
    </Layout>
  );
}
