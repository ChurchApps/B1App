"use client";

import { useContext, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { PaperProps } from "@mui/material";
import { Layout } from "@/components";
import { LoginPage, ApiHelper, UserHelper } from "@churchapps/apphelper";
import UserContext from "@/context/UserContext";
import { PersonHelper } from "@/helpers";
import { useSearchParams } from "next/navigation";
import { redirect } from "next/navigation";

interface Props {
  showLogo?: boolean;
  redirectAfterLogin?: string;
  loginContainerCssProps?: PaperProps;
  keyName?: string;
}

export function Login({ showLogo, redirectAfterLogin, loginContainerCssProps, keyName }: Props) {
  const searchParams = useSearchParams();
  const [returnUrl, setReturnUrl] = useState<string | null>(redirectAfterLogin);
  const [cookies] = useCookies();
  const context = useContext(UserContext);
  //const [jwt, setJwt] = useState<string>("");

  useEffect(() => {
    // Set returnUrl from searchParams or default to "/member"
    const urlParam = searchParams.get("returnUrl");
    setReturnUrl(urlParam || redirectAfterLogin || "/my");
  }, [searchParams]);

  useEffect(() => {
    if (ApiHelper.isAuthenticated && UserHelper.currentUserChurch?.church) {
      PersonHelper.person = context.person;
      redirect(`${returnUrl}`);
    }
  }, [context.person, returnUrl]);

  const jwt = searchParams.get("jwt") || cookies.jwt;


  return (
    <Layout withoutNavbar withoutFooter>
      <LoginPage
        auth={searchParams.get("auth")}
        context={context}
        jwt={jwt}
        appName="B1"
        showLogo={showLogo}
        loginContainerCssProps={loginContainerCssProps}
        keyName={keyName}
        returnUrl={returnUrl || "/my"}
      />
    </Layout>
  );
}
