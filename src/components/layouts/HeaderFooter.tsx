import Head from "next/head";
import { Header } from "../Header";
import { CssBaseline } from "@mui/material";
import { ArrayHelper, ChurchInterface, LinkInterface } from "@churchapps/apphelper";
import Zone from "./Zone";
import { GlobalStyleInterface } from "@/helpers";
import { Footer } from "./Footer";

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

//<Zone church={props.church} sections={props.pageData.sections} zone="footer" churchSettings={props.churchSettings} />
export function HeaderFooter(props: Props) {
  const getDescription = () => {
    if (props.metaDescription) return (<>
      <meta name="description" content={props.metaDescription}></meta>
      <meta property="og:description" content={props.ogDescription || props.metaDescription}></meta>
    </>);
  }

  const footerSections = ArrayHelper.getAll(props.pageData.sections, "zone", "siteFooter");
  console.log("Footer Sections", footerSections);

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
          </div>
        </main>
        <Footer church={props.church} churchSettings={props.churchSettings} footerSections={footerSections} />
      </div>
    </>
  );
}
