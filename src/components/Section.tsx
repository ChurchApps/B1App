import { SmallButton } from "@/appBase/components";
import { ElementInterface, SectionInterface } from "@/helpers";
import { Container } from "@mui/material";
import { CSSProperties } from "react";
import { Element } from "./Element";

interface Props { section: SectionInterface, onEdit?: (section: SectionInterface, element: ElementInterface) => void }

export const Section: React.FC<Props> = props => {

  const getElements = () => {
    const result: JSX.Element[] = []
    props.section.elements.forEach(e => {
      console.log("Element: " + JSON.stringify(e))
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

  const getClassName = () => {
    let result = "section";
    if (props.section.background.indexOf("/") > -1) result += " sectionDark"
    return result;
  }

  const getEdit = () => {
    if (props.onEdit) {
      return (<span style={{ position: "absolute", top: 3, right: 3, backgroundColor: "#FFF", borderRadius: 5 }}>
        <SmallButton icon="edit" onClick={() => props.onEdit(props.section, null)} />
      </span>)
    }
  }

  return (
    <div style={getStyle()} className={getClassName()}>
      <Container style={{ paddingTop: 40, paddingBottom: 40, position: "relative" }}>
        {getEdit()}
        {getElements()}
      </Container>
    </div>
  );
}
