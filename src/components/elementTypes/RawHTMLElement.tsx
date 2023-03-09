import { ElementInterface, SectionInterface } from "@/helpers";

interface Props {
  element: ElementInterface;
  onEdit?: (section: SectionInterface, element: ElementInterface) => void
}

export const RawHTMLElement = ({ element, onEdit }: Props) => {
  
  const emptyStyle = { minHeight: 50 }

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: element.answers.rawHTML || "" }} style={(!onEdit ? {} : emptyStyle)} />
    </>
  );
};
