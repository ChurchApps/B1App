import { ChurchInterface, NonAuthDonation } from "@churchapps/apphelper";
import { ElementInterface, SectionInterface } from "@/helpers";
import { DroppableArea } from "./admin/DroppableArea";
import { RowElement } from "./elementTypes/RowElement";
import { TextOnly } from "./elementTypes/TextOnly";
import { TextWithPhoto } from "./elementTypes/TextWithPhoto";
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
import { ImageElement } from "./elementTypes/ImageElement";
import { WhiteSpaceElement } from "./elementTypes/WhiteSpaceElement";
import { CalendarElement } from "./elementTypes/CalendarElement";
import { ApiHelper } from "@churchapps/apphelper";
import { BoxElement } from "./elementTypes/BoxElement";
import { TableElement } from "./elementTypes/TableElement";
import { DraggableWrapper } from "./admin/DraggableWrapper";
import { GroupListElement } from "./elementTypes/GroupListElement";

interface Props {
  element: ElementInterface;
  church?: ChurchInterface;
  churchSettings: any;
  textColor: string;
  onEdit?: (section: SectionInterface, element: ElementInterface) => void;
  onMove?: () => void;
  parentId?: string;
}

export const Element: React.FC<Props> = props => {

  console.log("ELEMENT props.church: ", props.church);

  const handleDrop = (data: any, sort: number) => {
    if (data.data) {
      const element: ElementInterface = data.data;
      element.sort = sort;
      element.sectionId = props.element.sectionId;
      element.parentId = props.element.parentId;
      ApiHelper.post("/elements", [element], "ContentApi").then(() => { props.onMove() });
    }
    else {
      const element: ElementInterface = { sectionId: props.element.sectionId, elementType: data.elementType, sort, blockId: props.element.blockId, parentId: props.parentId ? props.parentId : null };
      if (data.blockId) element.answersJSON = JSON.stringify({ targetBlockId: data.blockId });
      else if (data.elementType === "row") element.answersJSON = JSON.stringify({ columns: "6,6" });
      props.onEdit(null, element);
    }
  }

  const getAddElement = (s: number) => {
    const sort = s;
    return (<DroppableArea accept={["element", "elementBlock"]} onDrop={(data) => handleDrop(data, sort)} dndDeps={props.element} />);
  }

  const getAnimationClasses = () => {
    if (props.element.animations?.onShow) return "animated " + props.element.animations.onShow + " " + props.element.animations.onShowSpeed;
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
      result = <RowElement key={props.element.id} element={props.element as ElementInterface} onEdit={props.onEdit} churchSettings={props.churchSettings} textColor={props.textColor} onMove={props.onMove} />
      break;
    case "box":
      result = <BoxElement key={props.element.id} element={props.element as ElementInterface} onEdit={props.onEdit} churchSettings={props.churchSettings} textColor={props.textColor} onMove={props.onMove} />
      break;
    case "map":
      result = <MapElement key={props.element.id} element={props.element as ElementInterface} />
      break;
    case "donation":
      result = <NonAuthDonation key={props.element.id} churchId={props.church?.id ?? props.element.churchId} recaptchaSiteKey={process.env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY} mainContainerCssProps={{ sx: { boxShadow: "none", padding: 3 } }} showHeader={false} />
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
      result = <FormElement church={props.church} key={props.element.id} element={props.element as ElementInterface} />
      break;
    case "faq":
      result = <FaqElement key={props.element.id} element={props.element as ElementInterface} textColor={props.textColor} />
      break;
    case "sermons":
      result = <SermonElement key={props.element.id} churchId={props.church?.id ?? props.element.churchId} appearance={props.churchSettings} />
      break;
    case "carousel":
      result = <CarouselElement key={props.element.id} element={props.element as ElementInterface} onEdit={props.onEdit} churchSettings={props.churchSettings} textColor={props.textColor} onMove={props.onMove} />
      break;
    case "image":
      result = <ImageElement key={props.element.id} element={props.element as ElementInterface} />
      break;
    case "whiteSpace":
      result = <WhiteSpaceElement key={props.element.id} element={props.element as ElementInterface} onEdit={props.onEdit} />
      break;
    case "calendar":
      result = <CalendarElement key={props.element.id} element={props.element as ElementInterface} churchId={props.church?.id ?? props.element.churchId} />
      break;
    case "table":
      result = <TableElement key={props.element.id} element={props.element as ElementInterface} />
      break;
    case "groupList":
      result = <GroupListElement key={props.element.id} churchId={props.church?.id ?? props.element.churchId} element={props.element as ElementInterface} />
      break;
  }

  /*<DraggableIcon dndType="element" elementType={props.element.elementType} data={props.element} />*/
  if (props.onEdit) {
    result = <>
      <DraggableWrapper dndType="element" elementType={props.element.elementType} data={props.element}>
        <div className={"elementWrapper " + props.element.elementType } onDoubleClick={(e) => { e.stopPropagation(); props.onEdit(null, props.element); }}>
          {result}
        </div>
      </DraggableWrapper>
      {props.onEdit && getAddElement(props.element.sort + 0.1)}
    </>

    /*
    result = <><div className={"elementWrapper " + props.element.elementType }>
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
    */
  }
  return <div style={{ position: "relative" }} className={getAnimationClasses()}>{result}</div>;
}
