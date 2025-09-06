import React from "react";
import { ElementInterface, SectionInterface } from "@/helpers";
import { HtmlPreview } from "./HtmlPreview";
import { Card, CardContent } from "@mui/material";


interface Props { element: ElementInterface; onEdit?: (section: SectionInterface, element: ElementInterface) => void; }

export const CardElement: React.FC<Props> = (props) => {
  const textContent = props.element.answers?.text || "";
  const textAlign = props.element.answers?.textAlignment;

  // Create text component - use HtmlPreview for edit mode, HTML rendering for display
  const textComponent = props.onEdit
    ? <HtmlPreview value={textContent} textAlign={textAlign} element={props.element} showFloatingEditor onEdit={props.onEdit} />
    : <div
        style={{ textAlign: textAlign as any }}
        dangerouslySetInnerHTML={{ __html: textContent }}
      />;

  let photoContent = <></>
  if (props.element.answers?.photo) {
    const photo = <img src={props.element.answers?.photo || "about:blank"} alt={props.element.answers?.photoAlt || ""} style={{ borderRadius: 3 }} />
    if (props.element.answers?.url) photoContent = (<a href={props.element.answers?.url}>{photo}</a>);
    else photoContent = (photo);
  }

  let result: React.ReactElement[] = [];
  if (props.element.answers?.title) {
    const title = <h3 style={{textAlign:props.element.answers?.titleAlignment || "center"}}>{props.element.answers?.title}</h3>;
    if (props.element.answers?.url) result.push(<a href={props.element.answers?.url} key="title-link">{title}</a>);
    else result.push(<div key="title">{title}</div>);
  }
  if (props.element.answers?.text) result.push(<div key="text">{textComponent}</div>);

  return <Card id={"el-" + props.element.id}>
    {photoContent}
    <CardContent>
      {result}
    </CardContent>
  </Card>
}
