import { ChurchInterface, LinkInterface } from "@churchapps/apphelper";
import { HeaderFooter } from "./layouts/HeaderFooter";
import { CleanCentered } from "./layouts/CleanCentered";
import { Embedded } from "./layouts/Embedded";
import { StyleHelper } from "@/helpers/StyleHelper";
import { Helmet } from "react-helmet";
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

//add helmet here

export function PageLayout(props: Props) {


  StyleHelper.getAllStyles(props.pageData.sections);

  let result = <></>
  if (props.pageData) {
    switch (props.pageData?.layout) {
      case "cleanCentered":
        result = <CleanCentered church={props.church} churchSettings={props.churchSettings} navLinks={props.navLinks} pageData={props.pageData} />
        break;
      case "embed":
        result = <Embedded church={props.church} churchSettings={props.churchSettings} navLinks={props.navLinks} pageData={props.pageData} />
        break;
      case "headerFooter":
      default:
        result = <HeaderFooter church={props.church} churchSettings={props.churchSettings} navLinks={props.navLinks} pageData={props.pageData} globalStyles={props.globalStyles} />
        break;
    }
  }
  const css = StyleHelper.getCss(props.pageData.sections);
  console.log("CSS", css);
  return <>
    <Helmet><style>{css}</style></Helmet>
    {result}
  </>;

}
