import { ElementInterface } from "@/helpers";
import { MarkdownPreviewLight } from "@churchapps/apphelper";

interface Props { element: ElementInterface; }

export const TextOnly: React.FC<Props> = (props) => {
  let result = (<div id={"el-" + props.element.id}  className="elTextWithPhoto">
    <MarkdownPreviewLight value={props.element.answers?.text || ""} textAlign={props.element.answers?.textAlignment} />
  </div>);
  return result;
};
