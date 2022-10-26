import { ComponentInterface, RowInterface, SectionChildInterface, SectionInterface } from "@/helpers";
import { RowComponent } from "./componentTypes/RowComponent";
import { TextOnly } from "./componentTypes/TextOnly";
import { TextWithPhoto } from "./componentTypes/TextWithPhoto";

interface Props { component: SectionChildInterface }

export const Component: React.FC<Props> = props => {
  let result = <></>

  switch (props.component.componentType) {
    case "text":
      result = <TextOnly component={props.component as ComponentInterface} />
      break;
    case "textWithPhoto":
      result = <TextWithPhoto component={props.component as ComponentInterface} />
      break;
    case "row":
      result = <RowComponent row={props.component as RowInterface} />
      break;
    case "map":
      result = <h2>Google Map Goes Here</h2>
      break;

  }

  return result;
}
