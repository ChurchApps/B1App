import { ElementInterface } from "@/helpers";
import { MarkdownPreview } from "@/components";
import { Card, CardContent } from "@mui/material";


interface Props { element: ElementInterface; }

export const CardElement: React.FC<Props> = (props) => {

  let result: JSX.Element[] = [];

  if (props.element.answers?.photo) {
    const photo = <img src={props.element.answers?.photo || "about:blank"} alt={props.element.answers?.photoAlt || ""} style={{ borderRadius: 10, marginTop: 40 }} />
    if (props.element.answers?.url) result.push(<a href={props.element.answers?.url}>{photo}</a>);
    else result.push(photo);
  }
  if (props.element.answers?.title) {
    const title = <h2>{props.element.answers?.title}</h2>;
    if (props.element.answers?.url) result.push(<a href={props.element.answers?.url}>{title}</a>);
    else result.push(title);
  }
  result.push(<MarkdownPreview value={props.element.answers?.text || ""} />);

  return <Card>
    <CardContent>
      {result}
    </CardContent>
  </Card>
}
