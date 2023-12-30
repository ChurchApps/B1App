import { ElementInterface } from "@/helpers";
import { Grid } from "@mui/material";
import { MarkdownPreview } from "@churchapps/apphelper";
import { StyleHelper } from "@/helpers/StyleHelper";

interface Props { element: ElementInterface }

export const TextWithPhoto: React.FC<Props> = props => {
  let result = <MarkdownPreview value={props.element.answers?.text || ""} textAlign={props.element.answers?.textAlignment} />
  switch (props.element.answers?.photoPosition || "left") {
    case "left":
      result = (
        <Grid container columnSpacing={3}>
          <Grid item md={4} xs={12}>
            <img src={props.element.answers?.photo || "about:blank"} alt={props.element.answers?.photoAlt || ""} style={{ borderRadius: 10, marginTop: 40 }} />
          </Grid>
          <Grid item md={8} xs={12}>
            <MarkdownPreview value={props.element.answers?.text || ""} textAlign={props.element.answers?.textAlignment} />
          </Grid>
        </Grid>
      )
      break;
    case "right":
      result = (
        <Grid container columnSpacing={3}>
          <Grid item md={8} xs={12}>
            <MarkdownPreview value={props.element.answers?.text || ""} textAlign={props.element.answers?.textAlignment} />
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
          <MarkdownPreview value={props.element.answers?.text || ""} textAlign={props.element.answers?.textAlignment} />
          <img src={props.element.answers?.photo || "about:blank"} alt={props.element.answers?.photoAlt || ""} style={{ borderRadius: 10, marginTop: 40 }} />
        </>
      )
      break;
    case "top":
      result = (
        <>
          <img src={props.element.answers?.photo || "about:blank"} alt={props.element.answers?.photoAlt || ""} style={{ borderRadius: 10, marginTop: 40 }} />
          <MarkdownPreview value={props.element.answers?.text || ""} textAlign={props.element.answers?.textAlignment} />
        </>
      )
      break;
  }
  return <div style={{ marginBottom: 30, ...StyleHelper.getStyles(props.element) }}>{result}</div>;
}
