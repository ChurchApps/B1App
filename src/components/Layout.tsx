import Head from "next/head";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { ChurchInterface, LinkInterface } from "@/helpers";
import { HeaderFooter } from "./layouts/HeaderFooter";
import { CleanCentered } from "./layouts/CleanCentered";

type Props = {
  pageData: any;
  pageTitle?: string;
  metaDescription?: string;
  ogDescription?: string;
  churchSettings?: any;
  church?: ChurchInterface;
  navLinks?: LinkInterface[];
};

export function Layout(props: Props) {
  let result = <></>
  switch (props.pageData.layout) {
    case "cleanCentered":
      result = <CleanCentered church={props.church} churchSettings={props.churchSettings} navLinks={props.navLinks} pageData={props.pageData} />
      break;
    case "headerFooter":
    default:
      result = <HeaderFooter church={props.church} churchSettings={props.churchSettings} navLinks={props.navLinks} pageData={props.pageData} />
      break;
  }
  return result;

}
