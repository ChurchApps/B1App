import { ElementInterface, SectionInterface } from "@/helpers";
import { useEffect } from "react";

interface Props {
  element: ElementInterface;
  onEdit?: (section: SectionInterface, element: ElementInterface) => void
}

export const RawHTMLElement = ({ element, onEdit }: Props) => {

  const emptyStyle = { minHeight: 50 }

  const insertJavascript = () => {
    if (window && element.answers.javascript) {
      const script = document.createElement("script");
      script.id = "script-" + element.id;
      script.innerHTML = element.answers.javascript;
      const existing = document.getElementById(script.id);
      if (existing) existing.innerHTML = script.innerHTML;
      //existing.parentNode.removeChild(existing);
      else document.body.appendChild(script);
    }
  }

  useEffect(insertJavascript,[element.answers.javascript]);

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: element.answers.rawHTML || "" }} style={(!onEdit ? {} : emptyStyle)} />
    </>
  );
};
