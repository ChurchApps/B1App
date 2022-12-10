import { ElementInterface } from "@/helpers";
import { Markdown } from "../index";

interface Props { element: ElementInterface }

export const TextOnly: React.FC<Props> = props => {
  let result = <Markdown value={props.element.answers?.text || ""} />
  return result;
}
