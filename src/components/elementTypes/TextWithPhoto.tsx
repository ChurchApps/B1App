import { ElementInterface } from "@/helpers";
import { Grid } from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props { element: ElementInterface }

export const TextWithPhoto: React.FC<Props> = props => {
  let result = <ReactMarkdown remarkPlugins={[remarkGfm]}>{props.element.answers?.text || ""}</ReactMarkdown>
  switch (props.element.answers?.photoPosition || "left") {
    case "left":
      result = (
        <Grid container columnSpacing={3}>
          <Grid item md={4} xs={12}>
            <img src={props.element.answers?.photo || "about:blank"} alt={props.element.answers?.photoAlt || ""} style={{ borderRadius: 10, marginTop: 40 }} />
          </Grid>
          <Grid item md={8} xs={12}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{props.element.answers?.text || ""}</ReactMarkdown>
          </Grid>
        </Grid>
      )
      break;
    case "right":
      result = (
        <Grid container columnSpacing={3}>
          <Grid item md={8} xs={12}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{props.element.answers?.text || ""}</ReactMarkdown>
          </Grid>
          <Grid item md={4} xs={12}>
            <img src={props.element.answers?.photo || "about:blank"} alt={props.element.answers?.photoAlt || ""} style={{ borderRadius: 10, marginTop: 40 }} />
          </Grid>
        </Grid>
      )
      break;
    case "bottom":
      result = (
        <>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{props.element.answers?.text || ""}</ReactMarkdown>
          <img src={props.element.answers?.photo || "about:blank"} alt={props.element.answers?.photoAlt || ""} style={{ borderRadius: 10, marginTop: 40 }} />
        </>
      )
      break;
    case "top":
      result = (
        <>
          <img src={props.element.answers?.photo || "about:blank"} alt={props.element.answers?.photoAlt || ""} style={{ borderRadius: 10, marginTop: 40 }} />
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{props.element.answers?.text || ""}</ReactMarkdown>
        </>
      )
      break;
  }
  return result;
}
