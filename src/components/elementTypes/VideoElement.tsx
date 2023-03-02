import { ElementInterface } from "@/helpers";

interface Props {
  element: ElementInterface;
}

export const VideoElement: React.FC<Props> = (props) => {

  const youtubeEmbedLink = `https://www.youtube.com/embed/${props.element.answers.videoLinkUrl}`;
  const vimeoEmbedLink = `https://player.vimeo.com/video/${props.element.answers.videoLinkUrl}`

  const value = props.element?.answers?.video || "youtube"  

  return (
    <iframe
      src={value === "youtube" ? youtubeEmbedLink : vimeoEmbedLink}
      width="100%"
      height="300px"
      allowFullScreen
      style={{border: 0}}
    ></iframe>
  );
};