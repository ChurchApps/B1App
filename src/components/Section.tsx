import { SmallButton } from "@churchapps/apphelper";
import { ElementInterface, SectionInterface } from "@/helpers";
import { Container } from "@mui/material";
import { CSSProperties } from "react";
import { DraggableIcon } from "./admin/DraggableIcon";
import { DroppableArea } from "./admin/DroppableArea";
import { Element } from "./Element";
import { YoutubeBackground } from "./YoutubeBackground";
import { ApiHelper, ChurchInterface } from "@churchapps/apphelper";
import { StyleHelper } from "@/helpers/StyleHelper";

interface Props {
  first?: boolean,
  section: SectionInterface,
  church?: ChurchInterface;
  churchSettings: any;
  onEdit?: (section: SectionInterface, element: ElementInterface) => void;
  onMove?: () => void;
}

export const Section: React.FC<Props> = props => {

  const getElements = () => {
    const result: JSX.Element[] = []
    props.section.elements.forEach(e => {
      result.push(<Element key={e.id} element={e} onEdit={props.onEdit} onMove={props.onMove} church={props.church} churchSettings={props.churchSettings} textColor={props.section.textColor} />)
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
    if (props.section.textColor?.startsWith("var(")) result.color = props.section.textColor;

    result = { ...result, paddingTop: 40, paddingBottom: 40, position: "relative", ...StyleHelper.getStyles(props.section) };
    console.log("SECTION STYLE", result)
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

    let hc = props.section.headingColor;
    if (hc) {
      hc = hc.replace("var(--", "").replace(")", "");
      result += " headings" + hc[0].toUpperCase() + hc.slice(1);
    }

    return result;
  }

  const getEdit = () => {
    if (props.onEdit) {
      return (
        <div className="sectionActions">
          <table style={{ float: "right" }}>
            <tbody>
              <tr>
                <td><DraggableIcon dndType="section" elementType="section" data={props.section} /></td>
                <td>
                  <div className="sectionEditButton">
                    <SmallButton icon="edit" onClick={() => props.onEdit(props.section, null)} toolTip="section" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }
  }

  const handleDrop = (data: any, sort: number) => {
    if (data.data) {
      const element: ElementInterface = data.data;
      element.sort = sort;
      element.sectionId = props.section.id;
      ApiHelper.post("/elements", [element], "ContentApi").then(() => { props.onMove() });
    }
    else {
      const element: ElementInterface = { sectionId: props.section.id, elementType: data.elementType, sort, blockId: props.section.blockId };
      if (data.blockId) element.answersJSON = JSON.stringify({ targetBlockId: data.blockId });
      else if (data.elementType === "row") element.answersJSON = JSON.stringify({ columns: "6,6" });
      else if (data.elementType === "box") element.answersJSON = JSON.stringify({ background: "var(--light)", text: "var(--dark)" });
      props.onEdit(null, element);
    }
  }

  const getAddElement = (s: number) => {
    const sort = s;
    return (<DroppableArea accept={["element", "elementBlock"]} onDrop={(data) => handleDrop(data, sort)} />);
    //return (<div style={{ textAlign: "center", background: "rgba(230,230,230,0.25)" }}><SmallButton icon="add" onClick={() => props.onEdit(null, { sectionId: props.section.id, elementType: "textWithPhoto", sort })} toolTip="Add Element" /></div>)
  }

  let contents = (<Container>
    {props.onEdit && getAddElement(0)}
    {getEdit()}
    {getElements()}
  </Container>);

  if (props.section.background.indexOf("youtube:") > -1) {
    const youtubeId = props.section.background.split(":")[1];
    return (<YoutubeBackground videoId={youtubeId} overlay="rgba(0,0,0,.4)" contentClassName={getVideoClassName()}>{contents}</YoutubeBackground>);
  }
  else return (<div style={getStyle()} className={getClassName()} id={props.section.answers?.sectionId}>{contents}</div>);
}
