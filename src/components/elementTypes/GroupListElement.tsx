import { ElementInterface } from "@/helpers";
import { GroupList } from "../groups/GroupList";

interface Props {
  churchId: string;
  element: ElementInterface;
}

export const GroupListElement = (props: Props) => (
  <GroupList churchId={props.churchId} label={props.element?.answers?.label} />
);
