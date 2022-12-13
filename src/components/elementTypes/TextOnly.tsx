import { ElementInterface } from "@/helpers";
import { MarkdownPreview } from "@/components"

interface Props { element: ElementInterface }

export const TextOnly: React.FC<Props> = props => {
  let result = <MarkdownPreview value={props.element.answers?.text || ""} />
  return result;
}
