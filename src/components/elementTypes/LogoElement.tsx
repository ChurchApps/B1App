import { ElementInterface } from "@/helpers";
import { AppearanceHelper } from "@churchapps/apphelper";

interface Props { element: ElementInterface; churchSettings: any; textColor: string; }

export const LogoElement: React.FC<Props> = (props) => {



  let logoUrl = (props.textColor === "light")
    ? AppearanceHelper.getLogoDark(props.churchSettings.appearance ?? props.churchSettings, "/images/logo.png")
    : AppearanceHelper.getLogoLight(props.churchSettings.appearance ?? props.churchSettings, "/images/logo.png");

  const photo = <img src={logoUrl} alt={props.element.answers?.photoAlt || ""} className="img-fluid" id={"el-" + props.element.id} />
  const photoContent = (props.element.answers?.url) ? <a href={props.element.answers?.url}>{photo}</a> : photo;

  return photoContent;
}
