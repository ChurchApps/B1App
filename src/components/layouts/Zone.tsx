import { Section } from "@/components/Section";
import { SectionInterface } from "@/helpers";
import { ArrayHelper, ChurchInterface } from "@churchapps/apphelper";
import { SectionBlock } from "../SectionBlock";

type Props = {
  church: ChurchInterface,
  churchSettings: any,
  sections: SectionInterface[],
  zone: string;
};

// export default function Zone(props: Props) {
//   const result: JSX.Element[] = []
//   let first = true;
//   const sections = ArrayHelper.getAll(props.sections, "zone", props.zone);
//   for (let section of sections) {
//     if (section.targetBlockId) result.push(<SectionBlock key={section.id} section={section} churchSettings={props.churchSettings} />)
//     else result.push(<Section key={section.id} section={section} first={first} church={props.church} churchSettings={props.churchSettings} />)
//     first = false;
//   }
//   return <>{result}</>;
// }


export default function Zone(props: Props) {
  const result: JSX.Element[] = []
  let first = true;
  const sections = ArrayHelper.getAll(props.sections, "zone", props.zone);

  sections.forEach((section, index) => {
    const key = `${section.id || index}-${props.zone}`;
    if (section.targetBlockId) {
      result.push(<SectionBlock key={key} section={section} churchSettings={props.churchSettings} />);
    } else {
      result.push(<Section key={key} section={section} first={first} church={props.church} churchSettings={props.churchSettings} />);
    }
    first = false;
  });

  return <>{result}</>;
}
