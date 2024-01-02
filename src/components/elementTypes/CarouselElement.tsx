import Carousel from "react-material-ui-carousel";
import { ElementInterface, SectionInterface } from "@/helpers";
import { DroppableArea } from "../admin/DroppableArea";
import { Element } from "../Element";

interface Props {
  element: ElementInterface;
  churchSettings: any;
  textColor: string;
  onEdit?: (section: SectionInterface, element: ElementInterface) => void;
}

export const CarouselElement = ({ element, churchSettings, textColor, onEdit }: Props) => {

  const getClassName = () => {
    if (onEdit) return "columnWrapper";
    else return "";
  };

  const getAddElement = (column: ElementInterface, s: number, droppableAreaText?: string) => {
    const sort = s;
    return (
      <DroppableArea
        key={"add" + column.id}
        accept={["element", "elementBlock"]}
        text={droppableAreaText}
        onDrop={(data) =>
          onEdit(null, {
            sectionId: element.sectionId,
            elementType: data.elementType,
            sort,
            parentId: column.id,
            blockId: element.blockId,
          })
        }
        dndDeps={column}
      />
    );
  };

  const getElements = ( column: ElementInterface, elements: ElementInterface[] ) => {
    const result: JSX.Element[] = [];
    if (onEdit) result.push(getAddElement(column, 1));
    elements?.forEach((c) => {
      result.push(
        <Element
          key={c.id}
          element={c}
          onEdit={onEdit}
          churchSettings={churchSettings}
          textColor={textColor}
          parentId={column.id}
        />
      );
    });
    return result;
  };

  const getColumns = () => {
    const emptyStyle = { minHeight: 100, border: "1px solid #999" };
    const result: JSX.Element[] = [];
    element.elements?.forEach((c) => {
      result.push(
        <div
          key={c.id}
          className={getClassName()}
          style={c?.elements?.length > 0 || !onEdit ? {} : emptyStyle}
        >
          <div style={{ minHeight: "inherit" }}>
            {getElements(c, c.elements)}
          </div>
          {onEdit && <div style={{ height: "31px", paddingTop: "31px", paddingBottom: "31px" }}>{getAddElement(c, c?.elements?.[c?.elements.length - 1]?.sort + 0.1, "Drop at the bottom of slide")}</div>}
        </div>
      );
    });
    return result;
  };

  return (
    <>
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
    </>
  );
};
