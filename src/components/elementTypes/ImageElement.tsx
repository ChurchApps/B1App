import { ElementInterface } from "@/helpers";

interface Props {
  element: ElementInterface;
}

export const ImageElement = ({ element }: Props) => {
  let photoContent = <></>;

  const getClass = () => {
    let result = "";
    if (element.answers?.noResize === "true") result = "no-resize";
    return result
  }

  if (element.answers?.photo) {
    const photo = (
      <img
        src={element.answers?.photo || "about:blank"}
        alt={element.answers?.photoAlt || ""}
        className={getClass()}
        id={"el-" + element.id}
      />
    );
    if (element.answers?.url)
      photoContent = <a target={element.answers?.external === "true" ? "_blank" : "_self"} rel="noreferrer noopener" href={element.answers?.url}>{photo}</a>;
    else photoContent = photo;
  }
  return <>{photoContent}</>;
};
