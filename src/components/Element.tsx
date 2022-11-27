import { SmallButton } from "@/appBase/components";
import { ApiHelper, ElementInterface, SectionInterface } from "@/helpers";
import { DraggableIcon } from "./admin/DraggableIcon";
import { DroppableArea } from "./admin/DroppableArea";
import { RowElement } from "./elementTypes/RowElement";
import { TextOnly } from "./elementTypes/TextOnly";
import { TextWithPhoto } from "./elementTypes/TextWithPhoto";
import { NonAuthDonation } from "@/appBase/donationComponents/components"

interface Props {
  element: ElementInterface
  onEdit?: (section: SectionInterface, element: ElementInterface) => void
  onMove?: () => void
}

export const Element: React.FC<Props> = props => {

  const handleDrop = (data: any, sort: number) => {
    if (data.data) {
      const element: ElementInterface = data.data;
      element.sort = sort;
      element.sectionId = props.element.sectionId;
      ApiHelper.post("/elements", [element], "ContentApi").then(() => { props.onMove() });
    }
    else props.onEdit(null, { sectionId: props.element.sectionId, elementType: data.elementType, sort });
  }

  const getAddElement = (s: number) => {
    const sort = s;
    return (<DroppableArea accept="element" onDrop={(data) => handleDrop(data, sort)} />);
  }

  let result = <div style={{ minHeight: 100 }}>Unknown type: {props.element.elementType}</div>

  switch (props.element.elementType) {
    case "text":
      result = <TextOnly element={props.element as ElementInterface} />
      break;
    case "textWithPhoto":
      result = <TextWithPhoto element={props.element as ElementInterface} />
      break;
    case "row":
      result = <RowElement element={props.element as ElementInterface} onEdit={props.onEdit} />
      break;
    case "map":
      result = <h2>Google Map Goes Here</h2>
      break;
    case "donation":
      result = <NonAuthDonation churchId={props.element.churchId} mainContainerCssProps={{ sx: { boxShadow: "none", padding: 3 } }} showHeader={false} />
  }

  /*<DraggableIcon dndType="element" elementType={props.element.elementType} data={props.element} />*/

  if (props.onEdit) {
    result = <><div className="elementWrapper">

      <div className="elementActions">
        <table style={{ float: "right" }}>
          <tr>
            <td><DraggableIcon dndType="element" elementType={props.element.elementType} data={props.element} /></td>
            <td>
              <div className="sectionEditButton">
                <SmallButton icon="edit" onClick={() => props.onEdit(null, props.element)} />
              </div>
            </td>
          </tr>
        </table>
      </div>



      {result}
    </div>
      {props.onEdit && getAddElement(props.element.sort + 0.1)}
    </>
  }
  return <div style={{ position: "relative" }}>{result}</div>;
}
