import { Section } from "@/components/Section";
import { ChurchInterface, SectionInterface } from "@/helpers";

type Props = {
  church: ChurchInterface,
  sections: SectionInterface[]
};

export default function Zone(props: Props) {
  const result: JSX.Element[] = []
  let first = true;

  for (let section of props.sections) {
    result.push(<Section key={section.id} section={section} first={first} churchId={props.church.id} />)
    first = false;
  }

  return <>{result}</>;

}

