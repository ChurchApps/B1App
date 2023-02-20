import { ChurchInterface, ElementInterface } from "@/helpers";
import { LiveStream } from "../video/LiveStream";

interface Props { element: ElementInterface; churchSettings: any; church:ChurchInterface, editMode:boolean }

export const StreamElement: React.FC<Props> = (props) => {

  const mode = props.element.answers?.mode;
  const includeInteraction = mode !== "video";

  let offlineContent:JSX.Element = null;
  if (props.element.answers?.offlineContent === "hide") offlineContent = (props.editMode) ? (<>Offline Video Placeholder</>) : (<></>);

  return <LiveStream includeHeader={false} includeInteraction={includeInteraction} keyName={props.church?.subDomain} appearance={props.churchSettings} offlineContent={offlineContent} />;
}
