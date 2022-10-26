import { SectionInterface } from "@/helpers";
import { Container } from "@mui/material";
import { CSSProperties } from "react";
import { Component } from "./Component";

interface Props { section: SectionInterface }

export const Section: React.FC<Props> = props => {

  const getComponents = () => {
    const result: JSX.Element[] = []
    props.section.components.forEach(c => {
      result.push(<Component component={c} />)
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

  return (
    <div style={getStyle()} className={getClassName()}>
      <Container style={{ paddingTop: 40, paddingBottom: 40, position: "relative" }}>
        {getComponents()}
      </Container>
    </div>
  );
}
