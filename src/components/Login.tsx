import { useContext } from "react"
import { useRouter } from "next/router";
import { useCookies } from "react-cookie";
import { PaperProps } from "@mui/material"
import { Layout } from "@/components";
import { LoginPage } from "@/appBase/pageComponents/LoginPage";
import { ApiHelper, UserHelper } from "@/appBase/helpers";
import UserContext from "@/context/UserContext"

interface Props {
  showLogo?: boolean;
  redirectAfterLogin?: boolean;
  loginContainerCssProps?: PaperProps
}

export function Login({ showLogo, redirectAfterLogin = true, loginContainerCssProps }: Props) {
  const router = useRouter();
  const [cookies] = useCookies();
  const context = useContext(UserContext)

  if (ApiHelper.isAuthenticated && UserHelper.currentUserChurch?.church) {
    router.push("/admin");
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
        appName="YourSite.church"
        showLogo={showLogo}
        loginContainerCssProps={loginContainerCssProps}
      />
    </Layout>
  );
}
