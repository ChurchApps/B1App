import { ElementInterface, SectionInterface } from "./interfaces";

export class StyleHelper {

  private static getStyle = (id:string, styles:any) => {
    let result:string[] = [];
    Object.keys(styles).forEach((key:string) => {
      const val = styles[key];
      const noQuote = val.endsWith("px") || val.endsWith("em") || val.endsWith("pt") || val.startsWith("#") || val.startsWith("--");
      if (noQuote) result.push(`${key}: ${styles[key]};`);
      else result.push(`${key}: '${styles[key]}';`);
    });
    if (result.length > 0) return `#${id} { ${result.join(" ")} }`;
  }

  private static getSectionCss = (section:SectionInterface, all:string[], desktop:string[], mobile:string[]) => {
    const id = section.answers?.sectionId || "section-" + section.id;
    if (section.styles?.all) all.push(this.getStyle(id, section.styles.all));
    if (section.styles?.desktop) desktop.push(this.getStyle(id, section.styles.desktop));
    if (section.styles?.mobile) mobile.push(this.getStyle(id, section.styles.mobile));
  }

  private static getElementCss = (element:ElementInterface, all:string[], desktop:string[], mobile:string[]) => {
    if (element.styles?.all) all.push(this.getStyle("el-" + element.id, element.styles.all));
    if (element.styles?.desktop) desktop.push(this.getStyle("el-" + element.id, element.styles.desktop));
    if (element.styles?.mobile) mobile.push(this.getStyle("el-" + element.id, element.styles.mobile));
    if (element.elements?.length > 0) {
      element.elements.forEach((e:ElementInterface) => this.getElementCss(e, all, desktop, mobile));
    }
  }

  static getAllStyles = (sections: SectionInterface[]) => {
    let all:string[] = [];
    let desktop:string[] = [];
    let mobile:string[] = [];

    sections?.forEach((section:SectionInterface) => {
      this.getSectionCss(section, all, desktop, mobile);
      section.elements?.forEach((element:ElementInterface) => {
        this.getElementCss(element, all, desktop, mobile);
      });
    });

    return {all, desktop, mobile};
  }

  static getCss = (sections: SectionInterface[], forceDevice?:string) => {
    const {all, desktop, mobile} = this.getAllStyles(sections);
    if (forceDevice === "desktop") return all.join("\n") + "\n" + desktop.join("\n");
    else if (forceDevice === "mobile") return all.join("\n") + "\n" + mobile.join("\n");
    else return `
      ${all.join("\n")}
      @media (min-width: 768px) {
        ${desktop.join("\n")}
      }
      @media (max-width: 767px) {
        ${mobile.join("\n")}
      }`;
  }


  static getStyles = (element: ElementInterface | SectionInterface) => {



    let result:any = {};
    /*
    if (element.styles && Object.keys(element.styles).length > 0) {
      console.log("GET STYLES", element)
      Object.keys(element.styles).forEach((platformKey) => {
        const platform:any = element.styles[platformKey];
        Object.keys(platform).forEach((key) => {
          console.log("KEY", key);
          const parts = key.split("-");
          const camelCase = parts[0] + parts.slice(1).map((x) => x[0].toUpperCase() + x.slice(1)).join("");
          const option = allStyleOptions.find((x) => x.key === key);

          switch (option.type) {
            case "px":
              result[camelCase] = parseFloat(element.styles[key]);
              break;
            default:
              result[camelCase] = element.styles[key];
              break;
          }
          //console.log("OPTION", option, camelCase, element.styles[key], result)
        });

      });


    }
    */

    return result;

  }

}
