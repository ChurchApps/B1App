import { Header } from "@/components/Header";
import { Footer } from "@/components/layouts/Footer";
import { GlobalStyleInterface } from "@/helpers";
import { ApiHelper, ChurchInterface, LinkInterface } from "@churchapps/apphelper";
import { CssBaseline } from "@mui/material";
import Head from "next/head";

type Props = {
  pageTitle?: string;
  metaDescription?: string;
  ogDescription?: string;
  churchSettings?: any;
  church?: ChurchInterface;
  navLinks?: LinkInterface[];
  globalStyles: GlobalStyleInterface;
  children: JSX.Element | JSX.Element[];
};


//add helmet here

export async function DefaultPageWrapper(props: Props) {
  let a = 0;

  const footerSections = await ApiHelper.getAnonymous("/blocks/public/footer/" + props.church.id, "ContentApi");

  const getDescription = () => {
    if (props.metaDescription) return (<>
      <meta name="description" content={props.metaDescription}></meta>
      <meta property="og:description" content={props.ogDescription || props.metaDescription}></meta>
    </>);
  }



  return (<>
    <CssBaseline />
    <div>
      <Head>
        <title>{props.pageTitle || props.church?.name}</title>
        {getDescription()}
      </Head>
      <Header church={props.church} churchSettings={props.churchSettings} navLinks={props.navLinks} overlayContent={false} sections={[]} globalStyles={props.globalStyles} />
      <main>
        <div className="page">
          <div style={{paddingTop:90}}>
          </div>
          {props.children}

        </div>
      </main>
      <Footer church={props.church} churchSettings={props.churchSettings} footerSections={footerSections} />
    </div>
  </>);


}
