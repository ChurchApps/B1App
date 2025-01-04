"use client";

import React from "react";
import UserContext from "../../context/UserContext";
import { CssBaseline } from "@mui/material";
import { PersonHelper } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { AdminHeader } from "./AdminHeader";

interface Props {
  config: ConfigurationInterface;
  pageTitle?: string;
  children: React.ReactNode;
}

export const AdminWrapper: React.FC<Props> = (props) => {
  const context = React.useContext(UserContext);
  PersonHelper.person = context.person;

  return (
    <>
      <CssBaseline />
      <AdminHeader />
      <div style={{width:"100%"}}>
        <div id="appBarSpacer"></div>
        {props.children}
      </div>
    </>
  );
};
