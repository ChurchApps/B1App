import { ElementInterface, SectionInterface } from "@/helpers";
import { DroppableArea } from "../admin/DroppableArea";
import { Element } from "../Element";
import { CSSProperties } from "react";


interface Props { element: ElementInterface, churchSettings: any, textColor: string, onEdit?: (section: SectionInterface, element: ElementInterface) => void }

export function BoxElement(props: Props) {


  const getAddElement = (s: number) => {
    const sort = s;
    return (<DroppableArea key={"addToBox"} accept={["element", "elementBlock"]} onDrop={(data) => props.onEdit(null, { sectionId: props.element.sectionId, elementType: data.elementType, sort, parentId: props.element.id, blockId: props.element.blockId })} />);
  }

  const getElements = () => {
    const textColor = props.element.answers?.textColor || props.textColor;

    const result: JSX.Element[] = []
    if (props.onEdit) result.push(getAddElement(0))
    props.element.elements?.forEach(c => {
      result.push(<Element key={c.id} element={c} onEdit={props.onEdit} churchSettings={props.churchSettings} textColor={textColor} />)
    });
    return result;
  }


  const getStyle = () => {
    let result: CSSProperties = {  }
    if (props.element.answers?.background?.indexOf("/") > -1) {
      result = {
        backgroundImage: "url('" + props.element.answers?.background + "')"
      };
    } else {
      result = { background: props.element.answers?.background };
    }
    if (props.element.answers?.textColor?.startsWith("var(")) result.color = props.element.answers?.textColor;
    result.padding = 15;
    if (props.element.answers?.rounded==="true") result.borderRadius = 15;
    if (props.element.answers?.translucent==="true") result.opacity = 0.9;

    return result;
  }

  const getClass = () => {
    let result = "";
    let hc = props.element.answers?.headingColor;
    if (hc) {
      hc = hc.replace("var(--", "").replace(")", "");
      result = "headings" + hc[0].toUpperCase() + hc.slice(1)
    }
    return result;
  }

  let result = (<>
    {props.onEdit && <div style={{ height: 40 }}></div>}
    <div id={"el-" + props.element.id} style={getStyle()} className={getClass()}>
      {props.onEdit && !(props.element.elements || props.element.elements?.length===0) && <p>Box: Add elements</p>}
      {getElements()}
    </div>
  </>);

  return result;
}
