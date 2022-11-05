import { ElementInterface } from "@/helpers";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props { element: ElementInterface }

export const TextOnly: React.FC<Props> = props => {
  let result = <ReactMarkdown remarkPlugins={[remarkGfm]}>{props.element.answers?.text || ""}</ReactMarkdown>
  return result;
}
