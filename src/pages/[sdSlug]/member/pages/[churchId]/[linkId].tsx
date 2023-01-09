import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Wrapper, Theme } from "@/components";
import { EnvironmentHelper } from "@/helpers";

export default function Pages() {
  const [content, setContent] = useState("");
  const router = useRouter();
  const { churchId, linkId } = router.query;

  useEffect(() => {
    const path = `${EnvironmentHelper.Common.ContentRoot}/${churchId}/pages/${linkId}.html?ts=${new Date()
      .getTime()
      .toString()}`;
    fetch(path)
      .then((response) => response.text())
      .then((c) => {
        setContent(c);
      });
  }, []);

  return (
    <Wrapper>
      <div style={{ backgroundColor: "#FFF", height: "100vh" }}>
        <Theme />
        <div dangerouslySetInnerHTML={{ __html: content }} style={{ padding: 5 }} />
      </div>
      );
    </Wrapper>
  );
}
