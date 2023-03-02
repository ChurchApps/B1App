import { ElementInterface } from "@/helpers";

interface Props {
  element: ElementInterface;
}

export const VideoElement: React.FC<Props> = (props) => {
  const value = props.element?.answers?.videoType || "youtube";
  const src =
    value === "youtube"
      ? `https://www.youtube.com/embed/${props.element.answers.videoId}`
      : `https://player.vimeo.com/video/${props.element.answers.videoId}`;
  const height = props.element?.answers?.videoHeight || "300px";

  return <iframe src={src} width="100%" height={height} allowFullScreen style={{ border: 0 }} />;
};
