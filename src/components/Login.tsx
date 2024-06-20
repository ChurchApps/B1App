import { useContext } from "react"
import { useRouter } from "next/router";
import { useCookies } from "react-cookie";
import { PaperProps } from "@mui/material"
import { Layout } from "@/components";
import { LoginPage, ApiHelper, UserHelper } from "@churchapps/apphelper";
import UserContext from "@/context/UserContext"
import { PersonHelper } from "@/helpers";

interface Props {
  showLogo?: boolean;
  redirectAfterLogin?: boolean;
  loginContainerCssProps?: PaperProps
  keyName?: string;
}

export function Login({ showLogo, redirectAfterLogin = true, loginContainerCssProps, keyName }: Props) {
  const router = useRouter();
  let returnUrl:string = router.query.returnUrl as string;
  const [cookies] = useCookies();
  const context = useContext(UserContext)

  if (!returnUrl) returnUrl = "/member"

  if (ApiHelper.isAuthenticated && UserHelper.currentUserChurch?.church) {
    PersonHelper.person = context.person;
    router.push(`${returnUrl}`);
  }

  const appUrl = process.browser ? window.location.href : "";
  let jwt: string = "",
    auth: string = "";
  if (!ApiHelper.isAuthenticated) {
    auth = router.query.auth as string;
    let search = new URLSearchParams(process.browser ? window.location.search : "");
    jwt = search.get("jwt") || cookies.jwt;
  }

  return (
    <Layout withoutNavbar withoutFooter>
      <LoginPage
        auth={auth}
        context={context}
        jwt={jwt}
        appName="B1"
        showLogo={showLogo}
        loginContainerCssProps={loginContainerCssProps}
        keyName={keyName}
        returnUrl={returnUrl}
      />
    </Layout>
  );
}
