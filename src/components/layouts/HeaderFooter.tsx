import Head from "next/head";
import { Header } from "../Header";
import { Footer } from "../Footer";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { ChurchInterface, LinkInterface } from "@/helpers";
import Zone from "./Zone";

type Props = {
  pageData: any;
  pageTitle?: string;
  metaDescription?: string;
  ogDescription?: string;
  churchSettings?: any;
  church?: ChurchInterface;
  navLinks?: LinkInterface[];
};

export function HeaderFooter(props: Props) {
  const getDescription = () => {
    if (props.metaDescription) return (<>
      <meta name="description" content={props.metaDescription}></meta>
      <meta property="og:description" content={props.ogDescription || props.metaDescription}></meta>
    </>);
  }

  const mdTheme = createTheme({
    palette: {
      secondary: {
        main: "#444444"
      }
    },
    components: {
      MuiTextField: { defaultProps: { margin: "normal" } },
      MuiFormControl: { defaultProps: { margin: "normal" } }
    }
  });

  return (
    <ThemeProvider theme={mdTheme}>
      <CssBaseline />
      <div>
        <Head>
          <title>{props.pageTitle || props.church?.name}</title>
          {getDescription()}
        </Head>
        <Header church={props.church} churchSettings={props.churchSettings} navLinks={props.navLinks} />
        <main>
          <div id="page">
            <Zone church={props.church} sections={props.pageData.sections} />
          </div>
        </main>
        <Footer church={props.church} churchSettings={props.churchSettings} />
      </div>
    </ThemeProvider>
  );
}
