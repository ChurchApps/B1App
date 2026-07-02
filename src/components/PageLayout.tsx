import { HeaderFooter } from "./layouts/HeaderFooter";
import { CleanCentered } from "./layouts/CleanCentered";
import { Embedded } from "./layouts/Embedded";
import { StyleHelper } from "@churchapps/apphelper/website";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { SectionInterface } from "@/helpers/interfaces";
import { b1ImageOptimizer } from "@/helpers/imageOptimizer";

interface PageData {
  layout?: string;
  sections?: SectionInterface[];
}

type Props = {
  pageData: PageData;
  pageTitle?: string;
  metaDescription?: string;
  ogDescription?: string;
  config: ConfigurationInterface;
};

//add helmet here

export function PageLayout(props: Props) {


  StyleHelper.getAllStyles(props.pageData.sections);

  let result = <></>;
  if (props.pageData) {
    switch (props.pageData?.layout) {
      case "cleanCentered": result = <CleanCentered church={props.config.church} churchSettings={props.config.appearance} navLinks={props.config.navLinks} pageData={props.pageData} />; break;
      case "embed": result = <Embedded church={props.config.church} churchSettings={props.config.appearance} navLinks={props.config.navLinks} pageData={props.pageData} />; break;
      case "headerFooter":
      default: result = <HeaderFooter config={props.config} pageData={props.pageData} />; break;
    }
  }
  const css = StyleHelper.getCss(props.pageData.sections);
  const firstBg = props.pageData.sections?.[0]?.background;
  const isImageBg = firstBg && firstBg.indexOf("/") > -1 && firstBg.indexOf("youtube:") === -1;
  return <>
    {isImageBg && <link rel="preload" as="image" href={b1ImageOptimizer.backgroundSrc(firstBg)} fetchPriority="high" />}
    <style>{css}</style>
    {result}
  </>;

}
