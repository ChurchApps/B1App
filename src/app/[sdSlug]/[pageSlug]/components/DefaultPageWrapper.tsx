import { Header } from "@/components/Header";
import { Footer } from "@/components/layouts/Footer";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { ApiHelper } from "@churchapps/apphelper";
import { CssBaseline } from "@mui/material";

type Props = {
  overlayContent?: boolean;
  ogDescription?: string;
  config?: ConfigurationInterface
  children: JSX.Element | JSX.Element[];
  linkColor?: string;
};


//add helmet here

export async function DefaultPageWrapper(props: Props) {
  let a = 0;

  const footerSections = await ApiHelper.getAnonymous("/blocks/public/footer/" + props.config.church.id, "ContentApi");

  return (<>
    <CssBaseline />
    <div>
      <Header config={props.config} overlayContent={props.overlayContent} sections={[]} linkColor={props.linkColor} />
      <main>
        <div className="page">
          {!props.overlayContent && <div style={{ paddingTop: 90 }}></div>}

          {props.children}

        </div>
      </main>
      <Footer config={props.config} footerSections={footerSections} />
    </div>
  </>);


}
