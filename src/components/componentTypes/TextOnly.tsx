import { ComponentInterface } from "@/helpers";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props { component: ComponentInterface }

export const TextOnly: React.FC<Props> = props => {
  let result = <ReactMarkdown remarkPlugins={[remarkGfm]}>{props.component.answers.text}</ReactMarkdown>
  return result;
}
