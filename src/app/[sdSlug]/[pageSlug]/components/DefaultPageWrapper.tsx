import { Header } from "@/components/Header";
import { Footer } from "@/components/layouts/Footer";
import { GlobalStyleInterface } from "@/helpers";
import { ApiHelper, ChurchInterface, LinkInterface } from "@churchapps/apphelper";
import { CssBaseline } from "@mui/material";

type Props = {
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

  return (<>
    <CssBaseline />
    <div>
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
