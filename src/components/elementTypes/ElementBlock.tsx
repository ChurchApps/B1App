import { ElementInterface } from "@/helpers";
import { Element } from "../Element";

interface Props {
  element: ElementInterface;
}

const getChildren = (elements: ElementInterface[]) => {
  const result: JSX.Element[] = []
  elements?.forEach(c => {
    result.push(<Element key={c.id} element={c} />)
  });
  return result;
}

export const ElementBlock: React.FC<Props> = (props) => {
  let result = <>
    {getChildren(props.element.elements)}
  </>;
  return result;
};
