import { ElementInterface } from "@/helpers";

interface Props {
  element: ElementInterface;
}

export const ImageElement = ({ element }: Props) => {
  let photoContent = <></>;

  if (element.answers?.photo) {
    const photo = (
      <img
        src={element.answers?.photo || "about:blank"}
        alt={element.answers?.photoAlt || ""}
        style={{ borderRadius: 3, width: "100%" }}
      />
    );
    if (element.answers?.url)
      photoContent = <a href={element.answers?.url}>{photo}</a>;
    else photoContent = photo;
  }
  return <>{photoContent}</>;
};
