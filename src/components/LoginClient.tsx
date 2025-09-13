"use client";

import { useContext, useEffect, useState } from "react";
import { Alert } from "@mui/material";
import { Layout } from "@/components";
import { LoginPage } from "@churchapps/apphelper-login";
import UserContext from "@/context/UserContext";
import { PersonHelper } from "@/helpers";
import { useSearchParams } from "next/navigation";
import { redirect } from "next/navigation";

interface Props {
  showLogo?: boolean;
  redirectAfterLogin?: string;
  loginContainerCssProps?: any;
  keyName?: string;
}

export function LoginClient({ showLogo, redirectAfterLogin, loginContainerCssProps, keyName }: Props) {
  const searchParams = useSearchParams();
  const context = useContext(UserContext);
  const [cookies, setCookies] = useState<any>({});

  useEffect(() => {
    // Get cookies manually to avoid react-cookie SSR issues
    const cookieString = document.cookie;
    const cookieObj: any = {};
    cookieString.split(';').forEach(cookie => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) {
        cookieObj[key] = value;
      }
    });
    setCookies(cookieObj);
  }, []);

  const handleRedirect = (url: string) => {
    PersonHelper.person = context.person;
    redirect(url);
  };

  const jwt = searchParams.get("jwt") || cookies.jwt;

  return (
    <Layout withoutNavbar withoutFooter>


      {process.env.NEXT_PUBLIC_STAGE === "demo" && (<Alert severity="error" style={{ marginTop: 0 }}>
        <b>Demo:</b> This is the demo environment.  All data is erased nightly.<br />
        You can log into a test church with the credentials demo@chums.org / password .
      </Alert>)}
      <LoginPage
        auth={searchParams.get("auth")}
        context={context}
        jwt={jwt}
        appName="B1"
        showLogo={showLogo}
        loginContainerCssProps={loginContainerCssProps}
        keyName={keyName}
        returnUrl={searchParams.get("returnUrl") || redirectAfterLogin || "/my"}
        handleRedirect={handleRedirect}
        defaultEmail={process.env.NEXT_PUBLIC_STAGE === "demo" ? "demo@chums.org" : undefined}
        defaultPassword={process.env.NEXT_PUBLIC_STAGE === "demo" ? "password" : undefined}
        showFooter={true}
      />

    </Layout>
  );
}
