import { Wrapper } from "@/components";
import { ConfigHelper } from "@/helpers";
import { FormClient } from "./FormClient";


interface Props {
  params: { id: string; sdSlug: string };
}

export default async function FormPage({ params }: Props) {
    const {sdSlug}= await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return (
    <Wrapper config={config}>
      <FormClient config={config} formId={params.id} />
    </Wrapper>
  );
}