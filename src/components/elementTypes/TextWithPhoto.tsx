import dynamic from "next/dynamic";
import { ElementInterface } from "@/helpers";
import { Grid } from "@mui/material";
import { MarkdownPreview } from "@/components";

interface Props { element: ElementInterface }

const Preview = dynamic(() => import("@uiw/react-markdown-preview"), { ssr: false });

export const TextWithPhoto: React.FC<Props> = props => {
  let result = <MarkdownPreview editor={Preview} value={props.element.answers?.text || ""} />
  switch (props.element.answers?.photoPosition || "left") {
    case "left":
      result = (
        <Grid container columnSpacing={3}>
          <Grid item md={4} xs={12}>
            <img src={props.element.answers?.photo || "about:blank"} alt={props.element.answers?.photoAlt || ""} style={{ borderRadius: 10, marginTop: 40 }} />
          </Grid>
          <Grid item md={8} xs={12}>
            <MarkdownPreview editor={Preview} value={props.element.answers?.text || ""} />
          </Grid>
        </Grid>
      )
      break;
    case "right":
      result = (
        <Grid container columnSpacing={3}>
          <Grid item md={8} xs={12}>
            <MarkdownPreview editor={Preview} value={props.element.answers?.text || ""} />
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
          <MarkdownPreview editor={Preview} value={props.element.answers?.text || ""} />
          <img src={props.element.answers?.photo || "about:blank"} alt={props.element.answers?.photoAlt || ""} style={{ borderRadius: 10, marginTop: 40 }} />
        </>
      )
      break;
    case "top":
      result = (
        <>
          <img src={props.element.answers?.photo || "about:blank"} alt={props.element.answers?.photoAlt || ""} style={{ borderRadius: 10, marginTop: 40 }} />
          <MarkdownPreview editor={Preview} value={props.element.answers?.text || ""} />
        </>
      )
      break;
  }
  return result;
}
