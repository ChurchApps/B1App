import React from "react";
import { ElementInterface, SectionInterface } from "@/helpers";

interface Props {
  value: string;
  textAlign?: string;
  element: ElementInterface;
  showFloatingEditor?: boolean;
  onEdit?: (section: SectionInterface, element: ElementInterface) => void;
}

export const HtmlPreview: React.FC<Props> = (props) => {
  const handleClick = (e: React.MouseEvent) => {
    if (props.showFloatingEditor && props.onEdit) {
      e.preventDefault();
      e.stopPropagation();
      // Trigger the edit callback when the content is clicked
      props.onEdit(null, props.element);
    }
  };

  return (
    <div
      style={{ 
        textAlign: props.textAlign as any,
        cursor: props.showFloatingEditor ? "pointer" : "default",
        position: "relative"
      }}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: props.value || "" }}
      data-element-id={props.element?.id}
      className={props.showFloatingEditor ? "editable-html-content" : ""}
    />
  );
};