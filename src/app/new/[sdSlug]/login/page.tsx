"use client"

import { useCookies } from "react-cookie"
import { Layout } from "@/components";
import { LoginPage, ApiHelper, UserHelper } from "@churchapps/apphelper";
import React from "react";
import { redirect } from "next/navigation";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { useUser } from "@/app/context/UserContext";

export default function Login(params: any) {
  const [cookies] = useCookies()
  const returnUrl= (params.searchParams.returnUrl) ? params.searchParams.returnUrl.toString() : "/portal";
  const context = useUser();

  EnvironmentHelper.init();

  if (ApiHelper.isAuthenticated && UserHelper.currentUserChurch) {
    redirect(returnUrl)
  }

  const appUrl = (process.browser) ? window.location.href : "";
  let jwt: string = "", auth: string = "";
  if (!ApiHelper.isAuthenticated) {
    auth = params.searchParams.auth as string
    jwt = params.searchParams.jwt || cookies.jwt
  }
  console.log("JWT IS", jwt)


  return (
    <Layout withoutNavbar withoutFooter>
      <LoginPage auth={auth} context={context} jwt={jwt} appName="B1.church" appUrl={appUrl} returnUrl={returnUrl} />
    </Layout>
  );

}
