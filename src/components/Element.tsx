import { ElementInterface, RowInterface, SectionChildInterface } from "@/helpers";
import { RowElement } from "./elementTypes/RowElement";
import { TextOnly } from "./elementTypes/TextOnly";
import { TextWithPhoto } from "./elementTypes/TextWithPhoto";

interface Props { element: SectionChildInterface }

export const Element: React.FC<Props> = props => {
  let result = <></>

  switch (props.element.elementType) {
    case "text":
      result = <TextOnly element={props.element as ElementInterface} />
      break;
    case "textWithPhoto":
      result = <TextWithPhoto element={props.element as ElementInterface} />
      break;
    case "row":
      result = <RowElement row={props.element as RowInterface} />
      break;
    case "map":
      result = <h2>Google Map Goes Here</h2>
      break;

  }

  return result;
}
