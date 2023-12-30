import { ElementInterface } from "@/helpers";
import { StyleHelper } from "@/helpers/StyleHelper";

interface Props {
  element: ElementInterface;
}

export function IframeElement({ element }: Props) {

  return (
    <div style={{ display: "flex", ...StyleHelper.getStyles(element) }}>
      <iframe
        src={element.answers?.iframeSrc || ""}
        height={element.answers?.iframeHeight || "1000"}
        width="100%"
        style={{border:"none", backgroundColor:"#FFFFFF"}}
      />
    </div>
  );
}
