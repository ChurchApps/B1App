import { ElementInterface } from "@/helpers";

interface Props {
  element: ElementInterface;
}

export const VideoElement: React.FC<Props> = (props) => {
  console.log("yesysysy props from the videoElement.tsx", props);

  const rawLink =
    props.element.answers.video === "youtube" &&
    props.element.answers.videoLinkUrl.replace("watch?v=", "embed/");

  const embedLink = rawLink.replace("&themeRefresh=1", "");

  return (
    <iframe
      src={embedLink}
      //   src="https://player.vimeo.com/video/791837360"
      width="100%"
      height="300px"
      allowFullScreen
    ></iframe>
  );
};

//vimeo.com/791837360

https: {
  /* <iframe src="https://player.vimeo.com/video/791837360?h=544f5e275e" frameborder="0"></iframe> */
}
