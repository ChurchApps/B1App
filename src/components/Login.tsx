"use client";

import { useContext } from "react";
import { useCookies } from "react-cookie";
import { Alert, PaperProps } from "@mui/material";
import { Layout } from "@/components";
import { LoginPage } from "@churchapps/apphelper";
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
  const [cookies] = useCookies();
  const context = useContext(UserContext);


  const handleRedirect = (url: string) => {
    console.log("Redirecting to:", url);
    // Handle redirect if user is authenticated
    //if (ApiHelper.isAuthenticated && UserHelper.currentUserChurch?.church) {
    PersonHelper.person = context.person;
    redirect(url);
    //}
  };

  const jwt = searchParams.get("jwt") || cookies.jwt;

  return (
    <Layout withoutNavbar withoutFooter>
      <div style={{ marginLeft: "auto", marginRight: "auto", maxWidth: 600 }}>
        {process.env.NEXT_PUBLIC_STAGE === "demo" && (<Alert severity="error" style={{ marginTop: 50 }}>
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
        />
      </div>
    </Layout>
  );
}
