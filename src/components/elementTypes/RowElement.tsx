import { SmallButton } from "@/appBase/components";
import { ElementInterface, SectionInterface } from "@/helpers";
import { Grid } from "@mui/material";
import { DroppableArea } from "../admin/DroppableArea";
import { Element } from "../Element";

interface Props { element: ElementInterface, onEdit?: (section: SectionInterface, element: ElementInterface) => void }

export function RowElement(props: Props) {


  const getAddColumn = (s: number) => {
    const sort = s;
    return (<DroppableArea accept="column" onDrop={(data) => props.onEdit(null, { sectionId: props.element.sectionId, elementType: data.elementType, sort, parentId: props.element.id })} />);
    //return (<div style={{ textAlign: "center", background: "rgba(230,230,230,0.25)" }}><SmallButton icon="add" onClick={() => props.onEdit(null, { sectionId: props.element.sectionId, elementType: "column", sort, parentId: props.element.id })} toolTip="Add Column" /></div>)
  }


  const getAddElement = (column: ElementInterface, s: number) => {
    const sort = s;
    return (<DroppableArea accept="element" onDrop={(data) => props.onEdit(null, { sectionId: props.element.sectionId, elementType: data.elementType, sort, parentId: column.id })} />);
    //return (<div style={{ textAlign: "center", background: "rgba(230,230,230,0.25)" }}><SmallButton icon="add" onClick={() => props.onEdit(null, { sectionId: props.element.sectionId, elementType: "textWithPhoto", sort, parentId: column.id })} toolTip="Add Element" /></div>)
  }

  const getElements = (column: ElementInterface, elements: ElementInterface[]) => {
    const result: JSX.Element[] = []
    if (props.onEdit) result.push(getAddElement(column, 0))
    elements?.forEach(c => {
      result.push(<Element element={c} />)
    });
    return result;
  }

  const getClassName = () => {
    if (props.onEdit) return "columnWrapper";
    else return "";
  }

  const getColumns = () => {
    const result: JSX.Element[] = []
    props.element.elements?.forEach(c => {
      result.push(<Grid item md={c.answers.size} xs={12} className={getClassName()}>{getElements(c, c.elements)}</Grid>);
    });
    return result;
  }

  let result = (<Grid container columnSpacing={3}>
    {props.onEdit && getAddColumn(0)}
    {getColumns()}
  </Grid>);

  return result;
}
