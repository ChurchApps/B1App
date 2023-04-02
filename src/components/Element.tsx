import { SmallButton } from "@/appBase/components";
import { ApiHelper, ChurchInterface, ElementInterface, SectionInterface } from "@/helpers";
import { DraggableIcon } from "./admin/DraggableIcon";
import { DroppableArea } from "./admin/DroppableArea";
import { RowElement } from "./elementTypes/RowElement";
import { TextOnly } from "./elementTypes/TextOnly";
import { TextWithPhoto } from "./elementTypes/TextWithPhoto";
import { NonAuthDonation } from "@/appBase/donationComponents/components"
import { ElementBlock } from "./elementTypes/ElementBlock";
import { CardElement } from "./elementTypes/CardElement";
import { LogoElement } from "./elementTypes/LogoElement";
import { IframeElement } from "./elementTypes/IframeElement";
import { ButtonLink } from "./elementTypes/ButtonLink";
import { StreamElement } from "./elementTypes/StreamElement";
import { VideoElement } from "./elementTypes/VideoElement";
import { RawHTMLElement } from "./elementTypes/RawHTMLElement";
import { FormElement } from "./elementTypes/FormElement";
import { FaqElement } from "./elementTypes/FaqElement";
import { MapElement } from "./elementTypes/MapElement";
import { SermonElement } from "./elementTypes/SermonElement";
import { CarouselElement } from "./elementTypes/CarouselElement";

interface Props {
  element: ElementInterface;
  church?: ChurchInterface;
  churchSettings: any;
  textColor: string;
  onEdit?: (section: SectionInterface, element: ElementInterface) => void;
  onMove?: () => void;
}

export const Element: React.FC<Props> = props => {

  const handleDrop = (data: any, sort: number) => {
    if (data.data) {
      const element: ElementInterface = data.data;
      element.sort = sort;
      element.sectionId = props.element.sectionId;
      ApiHelper.post("/elements", [element], "ContentApi").then(() => { props.onMove() });
    }
    else {
      const element: ElementInterface = { sectionId: props.element.sectionId, elementType: data.elementType, sort, blockId: props.element.blockId };
      if (data.blockId) element.answersJSON = JSON.stringify({ targetBlockId: data.blockId });
      else if (data.elementType === "row") element.answersJSON = JSON.stringify({ columns: "6,6" });
      props.onEdit(null, element);
    }
  }

  const getAddElement = (s: number) => {
    const sort = s;
    return (<DroppableArea accept={["element", "elementBlock"]} onDrop={(data) => handleDrop(data, sort)} />);
  }

  let result = <div style={{ minHeight: 100 }}>Unknown type: {props.element.elementType}</div>

  switch (props.element.elementType) {
    case "block":
      result = <ElementBlock key={props.element.id} element={props.element as ElementInterface} churchSettings={props.churchSettings} textColor={props.textColor} />
      break;
    case "card":
      result = <CardElement key={props.element.id} element={props.element as ElementInterface} />
      break;
    case "logo":
      result = <LogoElement key={props.element.id} element={props.element as ElementInterface} churchSettings={props.churchSettings} textColor={props.textColor} />
      break;
    case "text":
      result = <TextOnly key={props.element.id} element={props.element as ElementInterface} />
      break;
    case "textWithPhoto":
      result = <TextWithPhoto key={props.element.id} element={props.element as ElementInterface} />
      break;
    case "row":
      result = <RowElement key={props.element.id} element={props.element as ElementInterface} onEdit={props.onEdit} churchSettings={props.churchSettings} textColor={props.textColor} />
      break;
    case "map":
      result = <MapElement key={props.element.id} element={props.element as ElementInterface} />
      break;
    case "donation":
      result = <NonAuthDonation key={props.element.id} churchId={props.church?.id ?? props.element.churchId} mainContainerCssProps={{ sx: { boxShadow: "none", padding: 3 } }} showHeader={false} />
      break;
    case "stream":
      result = <StreamElement key={props.element.id} element={props.element as ElementInterface} churchSettings={props.churchSettings} church={props.church} editMode={ props.onEdit !== undefined } />
      break;
    case "iframe":
      result = <IframeElement key={props.element.id} element={props.element as ElementInterface} />
      break;
    case "buttonLink":
      result = <ButtonLink key={props.element.id} element={props.element as ElementInterface}></ButtonLink>
      break;
    case "video":
      result = <VideoElement key={props.element.id} element={props.element as ElementInterface} />
      break;
    case "rawHTML":
      result = <RawHTMLElement key={props.element.id} element={props.element as ElementInterface} onEdit={props.onEdit} />
      break;
    case "form":
      result = <FormElement key={props.element.id} element={props.element as ElementInterface} />
      break;
    case "faq":
      result = <FaqElement key={props.element.id} element={props.element as ElementInterface} />
      break;
    case "sermons":
      result = <SermonElement key={props.element.id} churchId={props.church?.id ?? props.element.churchId} />
      break;
    case "carousel":
      result = <CarouselElement key={props.element.id} element={props.element as ElementInterface} onEdit={props.onEdit} churchSettings={props.churchSettings} textColor={props.textColor} />
      break;  
  }

  /*<DraggableIcon dndType="element" elementType={props.element.elementType} data={props.element} />*/
  if (props.onEdit) {
    result = <><div className="elementWrapper">
      <div className="elementActions">
        <table style={{ float: "right" }}>
          <tbody>
            <tr>
              <td><DraggableIcon dndType="element" elementType={props.element.elementType} data={props.element} /></td>
              <td>
                <div className="elementEditButton">
                  <SmallButton icon="edit" onClick={() => props.onEdit(null, props.element)} toolTip={props.element.elementType} />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {result}
    </div>
    {props.onEdit && getAddElement(props.element.sort + 0.1)}
    </>
  }
  return <div style={{ position: "relative" }}>{result}</div>;
}
