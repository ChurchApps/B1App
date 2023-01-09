import { Wrapper } from "@/components";

export default function Bible() {
  return (
    <Wrapper>
      <iframe
        title="content"
        className="full-frame"
        src="https://biblia.com/api/plugins/embeddedbible?layout=normal&historyButtons=false&resourcePicker=false&shareButton=false&textSizeButton=false&startingReference=Ge1.1&resourceName=nirv"
      />
    </Wrapper>
  );
}
