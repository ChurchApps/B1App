import { ElementInterface } from "@/helpers";

interface Props {
  element: ElementInterface;
}

export const RawHTMLElement = ({ element }: Props) => {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: element.answers.rawHTML }} />
    </>
  );
};
