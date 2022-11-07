import { ElementInterface } from "@/helpers";
import { Grid } from "@mui/material";
import { Element } from "../Element";

interface Props { row: ElementInterface }

export const RowElement: React.FC<Props> = props => {

  const getElements = (elements: ElementInterface[]) => {
    const result: JSX.Element[] = []
    elements.forEach(c => {
      result.push(<Element element={c} />)
    });
    return result;
  }

  const getColumns = () => {
    const result: JSX.Element[] = []
    props.row.elements.forEach(c => {
      result.push(<Grid item md={c.answers.size} xs={12}>{getElements(c.elements)}</Grid>);
    });
    return result;
  }

  let result = (<Grid container columnSpacing={3}>
    {getColumns()}
  </Grid>);

  return result;
}
