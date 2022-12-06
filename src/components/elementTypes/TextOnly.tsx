import { ElementInterface } from "@/helpers";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeAttrs from "rehype-attr";
import rehypeRaw from "rehype-raw";

interface Props { element: ElementInterface }

export const TextOnly: React.FC<Props> = props => {
  let result = <ReactMarkdown rehypePlugins={[rehypeRaw, [rehypeAttrs, { properties: "attr" }]]} remarkPlugins={[remarkGfm]}>{props.element.answers?.text || ""}</ReactMarkdown>
  return result;
}
