import { ElementInterface, SectionInterface } from "@/helpers";
import { Grid } from "@mui/material";
import { MarkdownPreviewLight, MarkdownPreview } from "@churchapps/apphelper";

interface Props { element: ElementInterface; onEdit?: (section: SectionInterface, element: ElementInterface) => void; }

export const TextWithPhoto: React.FC<Props> = props => {
  const editor = props?.onEdit ? <MarkdownPreview value={props.element.answers?.text || ""} textAlign={props.element.answers?.textAlignment} element={props.element} showFloatingEditor /> : <MarkdownPreviewLight value={props.element.answers?.text || ""} textAlign={props.element.answers?.textAlignment} />;
  let result = editor;
  switch (props.element.answers?.photoPosition || "left") {
    case "left":
      result = (
        <Grid container columnSpacing={3}>
          <Grid item md={4} xs={12}>
            <img src={props.element.answers?.photo || "about:blank"} alt={props.element.answers?.photoAlt || ""} style={{ borderRadius: 10, marginTop: 40 }} />
          </Grid>
          <Grid item md={8} xs={12}>
            {editor}
          </Grid>
        </Grid>
      )
      break;
    case "right":
      result = (
        <Grid container columnSpacing={3}>
          <Grid item md={8} xs={12}>
            {editor}
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
          {editor}
          <img src={props.element.answers?.photo || "about:blank"} alt={props.element.answers?.photoAlt || ""} style={{ borderRadius: 10, marginTop: 40 }} />
        </>
      )
      break;
    case "top":
      result = (
        <>
          <img src={props.element.answers?.photo || "about:blank"} alt={props.element.answers?.photoAlt || ""} style={{ borderRadius: 10, marginTop: 40 }} />
          {editor}
        </>
      )
      break;
  }
  return <div id={"el-" + props.element.id} className="elTextWithPhoto">{result}</div>;
}
