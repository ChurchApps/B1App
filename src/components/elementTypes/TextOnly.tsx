import dynamic from "next/dynamic";
import { ElementInterface } from "@/helpers";
import { MarkdownPreview } from "@/components"

interface Props { element: ElementInterface }

const Preview = dynamic(() => import("@uiw/react-markdown-preview"), { ssr: false });

export const TextOnly: React.FC<Props> = props => {
  let result = <MarkdownPreview editor={Preview} value={props.element.answers?.text || ""} />
  return result;
}
