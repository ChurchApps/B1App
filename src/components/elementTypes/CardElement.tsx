import { ElementInterface } from "@/helpers";
import { MarkdownPreview } from "@/components";
import { Card, CardContent } from "@mui/material";


interface Props { element: ElementInterface; }

export const CardElement: React.FC<Props> = (props) => {

  let photoContent = <></>
  if (props.element.answers?.photo) {
    const photo = <img src={props.element.answers?.photo || "about:blank"} alt={props.element.answers?.photoAlt || ""} style={{ borderRadius: 3 }} />
    if (props.element.answers?.url) photoContent = (<a href={props.element.answers?.url}>{photo}</a>);
    else photoContent = (photo);
  }

  let result: JSX.Element[] = [];
  if (props.element.answers?.title) {
    const title = <h3>{props.element.answers?.title}</h3>;
    if (props.element.answers?.url) result.push(<a href={props.element.answers?.url}>{title}</a>);
    else result.push(title);
  }
  if (props.element.answers?.text) result.push(<MarkdownPreview value={props.element.answers?.text || ""} />);

  return <Card>
    {photoContent}
    <CardContent>
      {result}
    </CardContent>
  </Card>
}
