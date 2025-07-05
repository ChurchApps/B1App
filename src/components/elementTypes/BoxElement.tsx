import React, { CSSProperties } from "react";
import { ElementInterface, SectionInterface } from "@/helpers";
import { DroppableArea } from "../admin/DroppableArea";
import { Element } from "../Element";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";

interface Props { element: ElementInterface, churchSettings: any, textColor: string, onEdit?: (section: SectionInterface, element: ElementInterface) => void, onMove?: () => void }

export function BoxElement(props: Props) {

  const handleDrop = (data: any, sort: number) => {
    if (data.data) {
      const e: ElementInterface = data.data;
      e.sort = sort;
      e.parentId = props.element.id;
      ApiHelper.post("/elements", [e], "ContentApi").then(() => { props.onMove() });
    } else {
      const e: ElementInterface = { sectionId: props.element.sectionId, elementType: data.elementType, sort, parentId: props.element.id, blockId: props.element.blockId };
      props.onEdit(null, e);
    }
  }

  const getAddElement = (s: number, droppableAreaText?: string) => {
    const sort = s;
    return (<DroppableArea key={"addToBox"} accept={["element", "elementBlock"]} text={droppableAreaText} onDrop={(data) => handleDrop(data, sort)} dndDeps={props.element?.elements} />);
  }

  const getElements = () => {
    const textColor = props.element.answers?.textColor || props.textColor;

    const result: React.ReactElement[] = []
    if (props.onEdit) result.push(getAddElement(1))
    props.element.elements?.forEach(c => {
      result.push(<Element key={c.id} element={c} onEdit={props.onEdit} churchSettings={props.churchSettings} textColor={textColor} parentId={props.element.id} onMove={props.onMove} />)
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
    let result = "elBox";
    let hc = props.element.answers?.headingColor;
    if (hc) {
      hc = hc.replace("var(--", "").replace(")", "");
      result += " headings" + hc[0].toUpperCase() + hc.slice(1)
    }
    let lc = props.element.answers?.linkColor;
    if (lc) {
      lc = lc.replace("var(--", "").replace(")", "");
      result += " links" + lc[0].toUpperCase() + lc.slice(1);
    }
    return result;
  }

  //{props.onEdit && <div style={{ height: "31px" }}>{getAddElement(props.element?.elements?.[props.element?.elements.length - 1]?.sort + 0.1, "Drop at the bottom of box")}</div>}
  let result = (<>
    {props.onEdit && <div style={{ height: 40 }}></div>}
    <div id={"el-" + props.element.id} style={getStyle()} className={getClass()}>
      {props.onEdit && !(props.element.elements || props.element.elements?.length===0) && <p>Box: Add elements</p>}
      {getElements()}

      {props.onEdit && <div style={{ height: "31px"}}></div>}
    </div>
  </>);

  return result;
}
