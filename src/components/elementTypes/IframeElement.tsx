import { ElementInterface } from "@/helpers";

interface Props {
  element: ElementInterface;
}

export function IframeElement({ element }: Props) {
  
  let align;
  switch (element.answers?.iframeAlignment) {
    case "right":
      align = "flex-end"
      break;
    case "center":
      align = "center"
      break;
    case "left":
    default:
      align = "flex-start"
      break;
  }

  return (
    <div style={{ display: "flex", justifyContent: align }}>
      <iframe
        src={element.answers?.iframeSrc || ""}
        height={element.answers?.iframeHeight}
        width={element.answers?.iframeWidth}
      />
    </div>
  );
}
