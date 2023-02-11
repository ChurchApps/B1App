import { ElementInterface } from "@/helpers";
import { MarkdownPreview } from "@/components";

interface Props { element: ElementInterface; }

export const TextOnly: React.FC<Props> = (props) => {
  let result = (<div style={{ marginBottom: 30 }}>
    <MarkdownPreview value={props.element.answers?.text || ""} textAlign={props.element.answers?.textAlignment} />
  </div>);
  return result;
};
