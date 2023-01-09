import { useRouter } from "next/router";
import { Wrapper } from "@/components";
import { ConfigHelper } from "@/helpers";

export default function Url() {
  const router = useRouter();
  const urlId = router.query.id as string;

  const linkObject = ConfigHelper.current.tabs.filter((t) => t.id === urlId)[0];

  return (
    <Wrapper>
      <iframe title="content" className="full-frame" src={linkObject.url} />
    </Wrapper>
  );
}
