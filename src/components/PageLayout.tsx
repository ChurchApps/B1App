import { ChurchInterface, LinkInterface } from "@churchapps/apphelper";
import { HeaderFooter } from "./layouts/HeaderFooter";
import { CleanCentered } from "./layouts/CleanCentered";
import { Embedded } from "./layouts/Embedded";

type Props = {
  pageData: any;
  pageTitle?: string;
  metaDescription?: string;
  ogDescription?: string;
  churchSettings?: any;
  church?: ChurchInterface;
  navLinks?: LinkInterface[];
};

export function PageLayout(props: Props) {
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
        result = <HeaderFooter church={props.church} churchSettings={props.churchSettings} navLinks={props.navLinks} pageData={props.pageData} />
        break;
    }
  }
  return result;

}
