import { ComponentInterface, RowInterface } from "@/utils";
import { Grid } from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Component } from "../Component";

interface Props { row: RowInterface }

export const RowComponent: React.FC<Props> = props => {

  const getComponents = (components: ComponentInterface[]) => {
    const result: JSX.Element[] = []
    components.forEach(c => {
      result.push(<Component component={c} />)
    });
    return result;
  }

  const getColumns = () => {
    const result: JSX.Element[] = []
    props.row.columns.forEach(c => {
      result.push(<Grid item md={c.size} xs={12}>{getComponents(c.components)}</Grid>);
    });
    return result;
  }

  let result = (<Grid container columnSpacing={3}>
    {getColumns()}
  </Grid>);

  return result;
}
