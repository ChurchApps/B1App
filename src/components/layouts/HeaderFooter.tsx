import Head from "next/head";
import { Header } from "../Header";
import { CssBaseline } from "@mui/material";
import { ChurchInterface, LinkInterface } from "@churchapps/apphelper";
import Zone from "./Zone";
import { GlobalStyleInterface } from "@/helpers";

type Props = {
  pageData: any;
  pageTitle?: string;
  metaDescription?: string;
  ogDescription?: string;
  churchSettings?: any;
  church?: ChurchInterface;
  navLinks?: LinkInterface[];
  globalStyles: GlobalStyleInterface;
};

export function HeaderFooter(props: Props) {
  const getDescription = () => {
    if (props.metaDescription) return (<>
      <meta name="description" content={props.metaDescription}></meta>
      <meta property="og:description" content={props.ogDescription || props.metaDescription}></meta>
    </>);
  }

  return (
    <>
      <CssBaseline />
      <div>
        <Head>
          <title>{props.pageTitle || props.church?.name}</title>
          {getDescription()}
        </Head>
        <Header church={props.church} churchSettings={props.churchSettings} navLinks={props.navLinks} overlayContent={props.pageData?.url === "/"} sections={props.pageData.sections} globalStyles={props.globalStyles} />
        <main>
          <div className="page">
            <Zone church={props.church} sections={props.pageData.sections} zone="main" churchSettings={props.churchSettings} />
            <Zone church={props.church} sections={props.pageData.sections} zone="footer" churchSettings={props.churchSettings} />
          </div>
        </main>
      </div>
    </>
  );
}
