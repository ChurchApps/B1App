import { EnvironmentHelper, ConfigHelper } from "@/helpers";
import { Wrapper } from "@/components";

export default function Stream() {
  return (
    <Wrapper>
      <iframe
        title="content"
        className="full-frame"
        src={EnvironmentHelper.Common.StreamingLiveRoot.replace("{key}", ConfigHelper.current.church.subDomain)}
      />
    </Wrapper>
  );
}
