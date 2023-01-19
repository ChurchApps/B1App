import { Section } from "@/components/Section";
import { ArrayHelper, ChurchInterface, SectionInterface } from "@/helpers";
import { SectionBlock } from "../SectionBlock";

type Props = {
  church: ChurchInterface,
  churchSettings: any,
  sections: SectionInterface[],
  zone: string;
};

export default function Zone(props: Props) {
  const result: JSX.Element[] = []
  let first = true;
  const sections = ArrayHelper.getAll(props.sections, "zone", props.zone);
  for (let section of sections) {
    if (section.targetBlockId) result.push(<SectionBlock key={section.id} section={section} churchSettings={props.churchSettings} />)
    else result.push(<Section key={section.id} section={section} first={first} churchId={props.church.id} churchSettings={props.churchSettings} />)
    first = false;
  }
  return <>{result}</>;
}
