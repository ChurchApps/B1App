import dynamic from "next/dynamic";
import { ElementInterface } from "@/helpers";
import { MarkdownPreview } from "@/components";

interface Props {
  element: ElementInterface;
}

const Editor = dynamic(() => import("react-draft-wysiwyg").then((mod) => mod.Editor), { ssr: false });

export const TextOnly: React.FC<Props> = (props) => {
  let result = <MarkdownPreview editor={Editor} value={props.element.answers?.text || ""} />;
  return result;
};
