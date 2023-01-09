import { Wrapper } from "@/components";
import { EnvironmentHelper, ConfigHelper } from "@/helpers";

export default function Lessons() {
  return (
    <Wrapper>
      <iframe
        title="content"
        className="full-frame"
        src={EnvironmentHelper.Common.LessonsRoot + "/b1/" + ConfigHelper.current.church.id}
      />
    </Wrapper>
  );
}
