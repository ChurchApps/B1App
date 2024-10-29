import { Wrapper } from "@/components";
import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { FormClient } from "./FormClient";

type Params = Promise<{ sdSlug: string; id:string }>;

export default async function FormPage({ params }: {params:Params}) {
  await EnvironmentHelper.initServerSide();
  const {sdSlug, id}= await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return (
    <Wrapper config={config}>
      <FormClient config={config} formId={id} />
    </Wrapper>
  );
}
