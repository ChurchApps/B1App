import { Wrapper } from "@/components";
import { ConfigHelper } from "@/helpers";

interface Props {
  params: { sdSlug: string };
}

export default async function BiblePage({ params }: Props) {
  const config = await ConfigHelper.load(params.sdSlug.toString());

  return (
    <Wrapper config={config}>
      <iframe
        title="content"
        className="full-frame"
        src="https://biblia.com/api/plugins/embeddedbible?layout=normal&historyButtons=false&resourcePicker=false&shareButton=false&textSizeButton=false&startingReference=Ge1.1&resourceName=nirv"
      />
    </Wrapper>
  );
}
