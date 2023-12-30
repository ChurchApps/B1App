import { ElementInterface } from "@/helpers";
import { StyleHelper } from "@/helpers/StyleHelper";
import { MarkdownPreview } from "@churchapps/apphelper";

interface Props { element: ElementInterface; }

export const TextOnly: React.FC<Props> = (props) => {
  let result = (<div style={{ ...StyleHelper.getStyles(props.element), marginBottom: 30 }}>
    <MarkdownPreview value={props.element.answers?.text || ""} textAlign={props.element.answers?.textAlignment} />
  </div>);
  return result;
};
