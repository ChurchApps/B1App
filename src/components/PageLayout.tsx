import { HeaderFooter } from "./layouts/HeaderFooter";
import { CleanCentered } from "./layouts/CleanCentered";
import { Embedded } from "./layouts/Embedded";
import { StyleHelper } from "@/helpers/StyleHelper";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";

type Props = {
  pageData: any;
  pageTitle?: string;
  metaDescription?: string;
  ogDescription?: string;
  config: ConfigurationInterface;
};

//add helmet here

export function PageLayout(props: Props) {


  StyleHelper.getAllStyles(props.pageData.sections);

  let result = <></>
  if (props.pageData) {
    switch (props.pageData?.layout) {
      case "cleanCentered":
        result = <CleanCentered church={props.config.church} churchSettings={props.config.appearance} navLinks={props.config.navLinks} pageData={props.pageData} />
        break;
      case "embed":
        result = <Embedded church={props.config.church} churchSettings={props.config.appearance} navLinks={props.config.navLinks} pageData={props.pageData} />
        break;
      case "headerFooter":
      default:
        result = <HeaderFooter config={props.config} pageData={props.pageData} />
        break;
    }
  }
  const css = StyleHelper.getCss(props.pageData.sections);
  return <>
    <style>{css}</style>
    {result}
  </>;

}
