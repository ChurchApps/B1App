import React from "react";
import { ElementInterface, SectionInterface } from "@/helpers";
import { Grid } from "@mui/material";
import { DroppableArea } from "../admin/DroppableArea";
import { Element } from "../Element";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import type { ChurchInterface } from "@churchapps/helpers";

interface Props { element: ElementInterface, churchSettings: any, textColor: string, onEdit?: (section: SectionInterface, element: ElementInterface) => void, onMove?: () => void, church?: ChurchInterface }

export function RowElement(props: Props) {

  const handleDrop = (data: any, sort: number, column: ElementInterface) => {
    if (data.data) {
      const element: ElementInterface = data.data;
      element.sort = sort;
      element.parentId = column.id;
      ApiHelper.post("/elements", [element], "ContentApi").then(() => { props.onMove() });
    } else {
      const element: ElementInterface = { sectionId: props.element.sectionId, elementType: data.elementType, sort, parentId: column.id, blockId: props.element.blockId }
      props.onEdit(null, element);
    }
  }

  const getAddElement = (column: ElementInterface, s: number, droppableAreaText?: string) => {
    const sort = s;
    return (<DroppableArea key={"add" + column.id} accept={["element", "elementBlock"]} text={droppableAreaText} onDrop={(data) => handleDrop(data, sort, column)} dndDeps={column} />);
    //return (<div style={{ textAlign: "center", background: "rgba(230,230,230,0.25)" }}><SmallButton icon="add" onClick={() => props.onEdit(null, { sectionId: props.element.sectionId, elementType: "textWithPhoto", sort, parentId: column.id })} toolTip="Add Element" /></div>)
  }

  const getElements = (column: ElementInterface, elements: ElementInterface[]) => {
    const result: React.ReactElement[] = []
    if (props.onEdit) result.push(getAddElement(column, 1))
    elements?.forEach(c => {
      result.push(<Element key={c.id} element={c} onEdit={props.onEdit} churchSettings={props.churchSettings} textColor={props.textColor} parentId={column.id} onMove={props.onMove} church={props?.church} />)
    });
    return result;
  }

  const getClassName = () => {
    if (props.onEdit) return "columnWrapper";
    else return "";
  }

  const getMobileOrder = (c:ElementInterface, idx:number) => {
    if (c.answers?.mobileOrder) return {xs: c.answers?.mobileOrder, md: idx};
  }

  const getColumns = () => {
    const emptyStyle = { minHeight: 100, border: "1px solid #999" }
    const result: React.ReactElement[] = []
    props.element.elements?.forEach((c:ElementInterface, idx:number) => {
      let xs = 12;
      if (c.answers?.mobileSize) xs = c.answers?.mobileSize;

      //{props.onEdit && <div style={{ height: "31px", paddingTop: "31px", paddingBottom: "31px" }}>{getAddElement(c, c?.elements?.[c?.elements.length - 1]?.sort + 0.1, "Drop at the bottom of column")}</div>}
      result.push(<Grid key={c.id} size={{ md: c.answers.size, xs: xs }} order={getMobileOrder(c,idx)} className={getClassName()} style={(c.elements?.length > 0 || !props.onEdit ? {} : emptyStyle)}>
        <div style={{ minHeight: "inherit" }}>
          {getElements(c, c.elements)}
        </div>
        {props.onEdit && <div style={{ height: "31px"}}></div>}
      </Grid>);
    });
    return result;
  }

  let result = (<>
    {props.onEdit && <div style={{ height: 40 }}></div>}
    <div id={"el-" + props.element.id}>
      <Grid container columnSpacing={3}>
        {getColumns()}
      </Grid>
    </div>
  </>);

  return result;
}
