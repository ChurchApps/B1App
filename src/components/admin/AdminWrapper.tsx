"use client";

import React, { useEffect } from "react";
import { redirect, usePathname } from "next/navigation";
import { ApiHelper } from "@churchapps/apphelper";
import UserContext from "../../context/UserContext";
import { CssBaseline } from "@mui/material";
import { PersonHelper, UrlHelper } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { AdminHeader } from "./AdminHeader";

interface Props {
  config: ConfigurationInterface;
  pageTitle?: string;
  children: React.ReactNode;
}

export const AdminWrapper: React.FC<Props> = (props) => {
  const { isAuthenticated } = ApiHelper;
  const context = React.useContext(UserContext);
  const pathname = usePathname();
  
  PersonHelper.person = context.person;

  useEffect(() => {
    if (!isAuthenticated) {
      const returnUrl = UrlHelper.getReturnUrl(pathname, props.config.keyName);
      redirect(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
    }
  }, [isAuthenticated, pathname, props.config.keyName]);

  if (!isAuthenticated) {
    return null;
  }

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
