import { ElementInterface, SectionInterface } from "@/helpers";
import { Grid } from "@mui/material";
import { HtmlPreview } from "./HtmlPreview";

interface Props { element: ElementInterface; onEdit?: (section: SectionInterface, element: ElementInterface) => void; }

export const TextWithPhoto: React.FC<Props> = props => {
  const textContent = props.element.answers?.text || "";
  const textAlign = props.element.answers?.textAlignment;

  // Create text component - use HtmlPreview for edit mode, HTML rendering for display
  const textComponent = props?.onEdit
    ? <HtmlPreview value={textContent} textAlign={textAlign} element={props.element} showFloatingEditor onEdit={props.onEdit} />
    : <div
        style={{ textAlign: textAlign as any }}
        dangerouslySetInnerHTML={{ __html: textContent }}
      />;
  let result = textComponent;
  switch (props.element.answers?.photoPosition || "left") {
    case "left":
      result = (
        <Grid container columnSpacing={3}>
          <Grid size={{ md: 4, xs: 12 }}>
            <img src={props.element.answers?.photo || "about:blank"} alt={props.element.answers?.photoAlt || ""} style={{ borderRadius: 10, marginTop: 40 }} />
          </Grid>
          <Grid size={{ md: 8, xs: 12 }}>
            {textComponent}
          </Grid>
        </Grid>
      )
      break;
    case "right":
      result = (
        <Grid container columnSpacing={3}>
          <Grid size={{ md: 8, xs: 12 }}>
            {textComponent}
          </Grid>
          <Grid size={{ md: 4, xs: 12 }}>
            <img src={props.element.answers?.photo || "about:blank"} alt={props.element.answers?.photoAlt || ""} style={{ borderRadius: 10, marginTop: 40 }} />
          </Grid>
        </Grid>
      )
      break;
    case "bottom":
      result = (
        <>
          {textComponent}
          <img src={props.element.answers?.photo || "about:blank"} alt={props.element.answers?.photoAlt || ""} style={{ borderRadius: 10, marginTop: 40 }} />
        </>
      )
      break;
    case "top":
      result = (
        <>
          <img src={props.element.answers?.photo || "about:blank"} alt={props.element.answers?.photoAlt || ""} style={{ borderRadius: 10, marginTop: 40 }} />
          {textComponent}
        </>
      )
      break;
  }
  return <div id={"el-" + props.element.id} className="elTextWithPhoto">{result}</div>;
}
