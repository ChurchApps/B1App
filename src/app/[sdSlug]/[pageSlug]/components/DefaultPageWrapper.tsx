import { Header } from "@/components/Header";
import { Footer } from "@/components/layouts/Footer";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { ApiHelper } from "@churchapps/apphelper";
import { CssBaseline } from "@mui/material";

type Props = {
  ogDescription?: string;
  config?: ConfigurationInterface
  children: JSX.Element | JSX.Element[];
};


//add helmet here

export async function DefaultPageWrapper(props: Props) {
  let a = 0;

  const footerSections = await ApiHelper.getAnonymous("/blocks/public/footer/" + props.config.church.id, "ContentApi");

  return (<>
    <CssBaseline />
    <div>
      <Header config={props.config} overlayContent={false} sections={[]} />
      <main>
        <div className="page">
          <div style={{paddingTop:90}}>
          </div>
          {props.children}

        </div>
      </main>
      <Footer config={props.config} footerSections={footerSections} />
    </div>
  </>);


}
