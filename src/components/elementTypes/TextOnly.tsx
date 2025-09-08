import { ElementInterface, SectionInterface } from "@/helpers";
import { HtmlPreview } from "./HtmlPreview";

interface Props { element: ElementInterface; onEdit?: (section: SectionInterface, element: ElementInterface) => void; }

export const TextOnly: React.FC<Props> = (props) => {
  const textContent = props.element.answers?.text || "";
  const textAlign = props.element.answers?.textAlignment;

  // If in edit mode, use the HtmlPreview with editor
  if (props?.onEdit) {
    return (
      <div id={"el-" + props.element.id} className="elTextWithPhoto">
        <HtmlPreview
          value={textContent}
          textAlign={textAlign}
          element={props.element}
          showFloatingEditor
          onEdit={props.onEdit}
        />
      </div>
    );
  }

  // For display mode, render HTML directly
  return (
    <div
      id={"el-" + props.element.id}
      className="elTextWithPhoto"
      style={{ textAlign: textAlign as any }}
      dangerouslySetInnerHTML={{ __html: textContent }}
    />
  );
};
