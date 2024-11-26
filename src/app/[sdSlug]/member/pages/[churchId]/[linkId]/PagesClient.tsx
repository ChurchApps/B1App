"use client";

import { useState, useEffect } from "react";
import { WrapperPageProps, EnvironmentHelper } from "@/helpers";
import { Theme, Wrapper } from "@/components";

interface Props extends WrapperPageProps {
  churchId: string;
  linkId: string;
  url?: string;
}

export function PagesClient({ config, churchId, linkId,url }: Props) {
  const [content, setContent] = useState("");


  useEffect(() => {
    if (!url) {
      const path = `${EnvironmentHelper.Common.ContentRoot}/${churchId}/pages/${linkId}.html?ts=${new Date().getTime().toString()}`;
      fetch(path)
        .then((response) => response.text())
        .then((c) => {
          setContent(c);
        });
    }
  }, [url, churchId, linkId]);

  if (url) {
    return (
      <Wrapper config={config}>
        <div style={{marginLeft:-25, marginRight:-25, marginTop: -64}}>
          <div className="b1Frame">
            <iframe src={url.toString()} frameBorder="0" />
          </div>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper config={config}>
      <div style={{ backgroundColor: "#FFF", height: "100vh" }}>
        <Theme globalStyles={{}} />
        <div dangerouslySetInnerHTML={{ __html: content }} style={{ padding: 5 }} />
      </div>
    </Wrapper>
  );
}
