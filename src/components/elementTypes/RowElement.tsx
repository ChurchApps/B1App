import { SmallButton } from "@/appBase/components";
import { ElementInterface, SectionInterface } from "@/helpers";
import { Grid } from "@mui/material";
import { Element } from "../Element";

interface Props { element: ElementInterface, onEdit?: (section: SectionInterface, element: ElementInterface) => void }

export function RowElement(props: Props) {


  const getAddColumn = (sort: number) => {
    return (<div style={{ textAlign: "center", background: "rgba(230,230,230,0.25)" }}><SmallButton icon="add" onClick={() => props.onEdit(null, { sectionId: props.element.sectionId, elementType: "column", sort, parentId: props.element.id })} toolTip="Add Column" /></div>)
  }


  const getAddElement = (column: Element, sort: number) => {
    return (<div style={{ textAlign: "center", background: "rgba(230,230,230,0.25)" }}><SmallButton icon="add" onClick={() => props.onEdit(null, { sectionId: props.element.sectionId, elementType: "textWithPhoto", sort, parentId: column.id })} toolTip="Add Element" /></div>)
  }

  const getElements = (column: Element, elements: ElementInterface[]) => {
    const result: JSX.Element[] = []
    if (props.onEdit) result.push(getAddElement(column, 0))
    elements?.forEach(c => {
      result.push(<Element element={c} />)
    });
    return result;
  }

  const getColumns = () => {
    const result: JSX.Element[] = []
    props.element.elements?.forEach(c => {
      result.push(<Grid item md={c.answers.size} xs={12} style={{}}>{getElements(c, c.elements)}</Grid>);
    });
    return result;
  }

  let result = (<Grid container columnSpacing={3}>
    {props.onEdit && getAddColumn(0)}
    {getColumns()}
  </Grid>);

  return result;
}
