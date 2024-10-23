import { Wrapper } from "@/components";
import { ConfigHelper, WrapperPageProps } from "@/helpers";
import { EnvironmentHelper } from "@/helpers";

interface Props {
  params: { sdSlug: string };
}

export default async function StreamPage({ params }: Props) {
  const config = await ConfigHelper.load(params.sdSlug.toString());

  return (
    <Wrapper config={config}>
      <iframe
        title="content"
        className="full-frame"
        src={EnvironmentHelper.Common.B1Root.replace("{key}", config.church.subDomain) + "/stream?hideHeader=1"}
      />
    </Wrapper>
  );
}
