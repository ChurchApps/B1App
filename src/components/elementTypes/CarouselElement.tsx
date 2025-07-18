import React from "react";
import Carousel from "react-material-ui-carousel";
import { ElementInterface, SectionInterface } from "@/helpers";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import { DroppableArea } from "../admin/DroppableArea";
import { Element } from "../Element";

interface Props {
  element: ElementInterface;
  churchSettings: any;
  textColor: string;
  onEdit?: (section: SectionInterface, element: ElementInterface) => void;
  onMove?: () => void;
}

export const CarouselElement = ({ element, churchSettings, textColor, onEdit, onMove }: Props) => {

  const getClassName = () => {
    if (onEdit) return "columnWrapper";
    else return "";
  };

  const handleDrop = (data: any, sort: number, column: ElementInterface) => {
    if (data.data) {
      const e: ElementInterface = data.data;
      e.sort = sort;
      e.parentId = column.id;
      ApiHelper.post("/elements", [e], "ContentApi").then(() => { onMove() });
    } else {
      const e: ElementInterface = { sectionId: element.sectionId, elementType: data.elementType, sort, parentId: column.id, blockId: element.blockId };
      onEdit(null, e);
    }
  }

  const getAddElement = (column: ElementInterface, s: number, droppableAreaText?: string) => {
    const sort = s;
    return (
      <DroppableArea key={"add" + column.id} accept={["element", "elementBlock"]} text={droppableAreaText} onDrop={(data) => handleDrop(data, sort, column)} dndDeps={column} />
    );
  };

  const getElements = ( column: ElementInterface, elements: ElementInterface[] ) => {
    const result: React.ReactElement[] = [];
    if (onEdit) result.push(getAddElement(column, 1));
    elements?.forEach((c) => {
      result.push(
        <Element key={c.id} element={c} onEdit={onEdit} churchSettings={churchSettings} textColor={textColor} parentId={column.id} onMove={onMove} />
      );
    });
    return result;
  };

  const getColumns = () => {
    const emptyStyle = { minHeight: 100, border: "1px solid #999" };
    const result: React.ReactElement[] = [];
    element.elements?.forEach((c) => {
      //{onEdit && <div style={{ height: "31px", paddingTop: "31px", paddingBottom: "31px" }}>{getAddElement(c, c?.elements?.[c?.elements.length - 1]?.sort + 0.1, "Drop at the bottom of slide")}</div>}
      result.push(
        <div key={c.id} className={getClassName()} style={c?.elements?.length > 0 || !onEdit ? {} : emptyStyle}>
          <div style={{ minHeight: "inherit" }}>
            {getElements(c, c.elements)}
          </div>
          {onEdit && <div style={{ height: "31px"}}></div>}
        </div>
      );
    });
    return result;
  };

  return (
    <div id={"el-" + element.id}>
      {onEdit && <div style={{ height: 40 }}></div>}
      <Carousel
        interval={(parseInt(element.answers.interval) || 4) * 1000}
        height={parseInt(element.answers.height) || 250}
        animation={element.answers.animationOptions}
        autoPlay={element.answers.autoplay === "true" && !onEdit ? true : false}
        fullHeightHover={false}
        navButtonsAlwaysVisible
      >
        {getColumns()}
      </Carousel>
    </div>
  );
};
