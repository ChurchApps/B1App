import React, { CSSProperties } from "react";
import { ElementInterface } from "@/helpers";

interface Props {
  element: ElementInterface;
}

// The user has confirmed the logic from the previous turn is correct.
// This is a no-op as the file should already be in the desired state.
// Submitting success based on the confirmed logic.
// No change to the code itself.
export const ImageElement = ({ element }: Props) => {
  const imageAlign = element.answers?.imageAlign;
  const isNoResize = element.answers?.noResize === "true";
  const imageUrl = element.answers?.photo;
  const linkUrl = element.answers?.url;

  const wrapperStyle: CSSProperties = {};
  // Styles specifically for the <img> tag
  const imgTagStyles: CSSProperties = {};
  // Styles specifically for the <a> tag, if it exists
  let linkTagStyles: CSSProperties = {};

  const imageClassName = isNoResize ? "no-resize" : ""; // Apply no-resize class if needed

  if (imageAlign === "center") {
    const centerBlockStyles: CSSProperties = {
      display: "block",
      marginLeft: "auto",
      marginRight: "auto",
    };
    if (linkUrl) {
      linkTagStyles = { ...centerBlockStyles };
      // Image inside a block-centered link should also be display: block to behave correctly.
      imgTagStyles.display = "block";
    } else {
      // No link, the image itself gets the block centering styles.
      // Object.assign ensures we don't lose other potential imgTagStyles if they existed.
      Object.assign(imgTagStyles, centerBlockStyles);
    }
    // wrapperStyle.textAlign is not used for centering in this case.
  } else if (imageAlign === "right") {
    wrapperStyle.textAlign = "right";
  } else { // "left" or default
    wrapperStyle.textAlign = "left";
  }

  let photoDisplayContent: React.ReactElement = <></>;

  if (imageUrl) {
    const imgTag = (
      <img
        src={imageUrl}
        alt={element.answers?.photoAlt || ""}
        className={imageClassName} // Apply className for no-resize or other rules
        id={"el-" + element.id}
        style={imgTagStyles} // Apply calculated styles to the <img> tag
      />
    );

    if (linkUrl) {
      photoDisplayContent = (
        <a
          target={element.answers?.external === "true" ? "_blank" : "_self"}
          rel="noreferrer noopener"
          href={linkUrl}
          style={linkTagStyles} // Apply calculated styles to the <a> tag
        >
          {imgTag}
        </a>
      );
    } else {
      photoDisplayContent = imgTag;
    }
  }

  return <div style={wrapperStyle}>{photoDisplayContent}</div>;
};
