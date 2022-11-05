import { SmallButton } from "@/appBase/components";
import { ElementInterface, RowInterface, SectionChildInterface, SectionInterface } from "@/helpers";
import { RowElement } from "./elementTypes/RowElement";
import { TextOnly } from "./elementTypes/TextOnly";
import { TextWithPhoto } from "./elementTypes/TextWithPhoto";

interface Props {
  element: SectionChildInterface
  onEdit?: (section: SectionInterface, element: ElementInterface) => void
}

export const Element: React.FC<Props> = props => {
  let result = <div style={{ minHeight: 100 }}>Unknown type: {props.element.elementType}</div>

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

  if (props.onEdit) {
    result = <>
      <span style={{ position: "absolute", top: 3, right: 3, backgroundColor: "#FFF", borderRadius: 5 }}>
        <SmallButton icon="edit" onClick={() => props.onEdit(null, props.element)} />
      </span>
      {result}
    </>
  }
  return <div style={{ position: "relative" }}>{result}</div>;
}
