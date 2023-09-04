import Head from "next/head";
import { Box, Card, createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { ChurchInterface, LinkInterface } from "@churchapps/apphelper";
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

export function CleanCentered(props: Props) {
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

        <Box sx={{ backgroundColor: "#f9f9f9", minHeight: "100vh" }}>
          <Box sx={{ maxWidth: "930px", margin: "auto", paddingY: "72px" }}>
            <Card>
              <main>
                <div className="page">
                  <Zone church={props.church} sections={props.pageData.sections} zone="main" churchSettings={props.churchSettings} />
                </div>
              </main>
            </Card>
          </Box>
        </Box>

      </div>
    </ThemeProvider>
  );
}
