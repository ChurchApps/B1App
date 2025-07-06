import { ElementInterface, SectionInterface } from "@/helpers";
import { MarkdownPreviewLight, MarkdownPreview } from "@churchapps/apphelper/dist/components/markdownEditor";

interface Props { element: ElementInterface; onEdit?: (section: SectionInterface, element: ElementInterface) => void; }

export const TextOnly: React.FC<Props> = (props) => {
  let result = (<div id={"el-" + props.element.id}  className="elTextWithPhoto">
    {props?.onEdit
      ? <MarkdownPreview value={props.element.answers?.text || ""} textAlign={props.element.answers?.textAlignment} element={props.element} showFloatingEditor />
      : <MarkdownPreviewLight value={props.element.answers?.text || ""} textAlign={props.element.answers?.textAlignment} />
    }
  </div>);
  return result;
};
