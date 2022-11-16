import { SmallButton } from "@/appBase/components";
import { ElementInterface, SectionInterface } from "@/helpers";
import { Container, Icon } from "@mui/material";
import { CSSProperties } from "react";
import { AddableElement } from "./admin/AddableElement";
import { DraggableIcon } from "./admin/DraggableIcon";
import { DroppableArea } from "./admin/DroppableArea";
import { Element } from "./Element";
import { YoutubeBackground } from "./YoutubeBackground";

interface Props {
  first?: boolean,
  section: SectionInterface,
  onEdit?: (section: SectionInterface, element: ElementInterface) => void
}

export const Section: React.FC<Props> = props => {

  const getElements = () => {
    const result: JSX.Element[] = []
    props.section.elements.forEach(e => {
      result.push(<Element element={e} onEdit={props.onEdit} />)
    });
    return result;
  }

  const getStyle = () => {
    let result: CSSProperties = {}
    if (props.section.background.indexOf("/") > -1) {
      result = {
        backgroundImage: "url('" + props.section.background + "')"
      };
    } else {
      result = { background: props.section.background };
    }
    return result;
  }

  const getVideoClassName = () => {
    let result = "";
    if (props.section.textColor === "light") result += " sectionDark"
    if (props.first) result += " sectionFirst"
    if (props.onEdit) result += " sectionWrapper";
    return result;
  }

  const getClassName = () => {
    let result = "section";
    if (props.section.background.indexOf("/") > -1) result += " sectionBG"
    if (props.section.textColor === "light") result += " sectionDark"
    if (props.first) result += " sectionFirst";
    if (props.onEdit) result += " sectionWrapper";
    return result;
  }

  const getEdit = () => {
    if (props.onEdit) {
      return (
        <div>
          <DraggableIcon dndType="section" elementType="section" />
          <span className="sectionEditButton">
            <SmallButton icon="edit" onClick={() => props.onEdit(props.section, null)} />
          </span>
        </div>);
    }
  }

  const getAddElement = (sort: number) => {
    return (<DroppableArea accept="element" onDrop={(data) => props.onEdit(null, { sectionId: props.section.id, elementType: data.elementType, sort })} />);
    //return (<div style={{ textAlign: "center", background: "rgba(230,230,230,0.25)" }}><SmallButton icon="add" onClick={() => props.onEdit(null, { sectionId: props.section.id, elementType: "textWithPhoto", sort })} toolTip="Add Element" /></div>)
  }

  let contents = (<Container style={{ paddingTop: 40, paddingBottom: 40, position: "relative" }}>
    {props.onEdit && getAddElement(0)}
    {getEdit()}
    {getElements()}
  </Container>);

  if (props.section.background.indexOf("youtube") > -1) return (<YoutubeBackground videoId="3iXYciBTQ0c" overlay="rgba(0,0,0,.4)" contentClassName={getVideoClassName()}>{contents}</YoutubeBackground>);
  else return (<div style={getStyle()} className={getClassName()}>{contents}</div>);
}
