import { ComponentInterface } from "@/utils";
import { Grid } from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props { component: ComponentInterface }

export const TextWithPhoto: React.FC<Props> = props => {
  let result = <ReactMarkdown remarkPlugins={[remarkGfm]}>{props.component.answers.text}</ReactMarkdown>
  switch (props.component.answers.photoPosition) {
    case "left":
      result = (
        <Grid container columnSpacing={3}>
          <Grid item md={4} xs={12}>
            <img src={props.component.answers.photo} alt={props.component.answers.photoAlt} style={{ borderRadius: 10, marginTop: 40 }} />
          </Grid>
          <Grid item md={8} xs={12}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{props.component.answers.text}</ReactMarkdown>
          </Grid>
        </Grid>
      )
      break;
    case "right":
      result = (
        <Grid container columnSpacing={3}>
          <Grid item md={8} xs={12}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{props.component.answers.text}</ReactMarkdown>
          </Grid>
          <Grid item md={4} xs={12}>
            <img src={props.component.answers.photo} alt={props.component.answers.photoAlt} style={{ borderRadius: 10, marginTop: 40 }} />
          </Grid>
        </Grid>
      )
      break;
    case "bottom":
      result = (
        <>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{props.component.answers.text}</ReactMarkdown>
          <img src={props.component.answers.photo} alt={props.component.answers.photoAlt} style={{ borderRadius: 10, marginTop: 40 }} />
        </>
      )
      break;
  }
  return result;
}
