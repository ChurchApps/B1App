import { ElementInterface, SectionInterface, allStyleOptions } from "./interfaces";

export class StyleHelper {

  static getStyles = (element: ElementInterface | SectionInterface) => {


    let result:any = {};
    if (element.styles && Object.keys(element.styles).length > 0) {
      console.log("GET STYLES", element)
      Object.keys(element.styles).forEach((key) => {
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
        console.log("OPTION", option, camelCase, element.styles[key], result)
      });
    }

    return result;

  }

}
