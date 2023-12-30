import { ElementInterface } from "@/helpers";
import { StyleHelper } from "@/helpers/StyleHelper";

interface Props {
  element: ElementInterface;
}

export const VideoElement: React.FC<Props> = (props) => {
  const value = props.element?.answers?.videoType || "youtube";
  const src
    = value === "youtube"
      ? `https://www.youtube.com/embed/${props.element.answers.videoId}`
      : `https://player.vimeo.com/video/${props.element.answers.videoId}`;

  return (
    <div className="videoWrapper" style={{marginBottom: "20px", ...StyleHelper.getStyles(props.element)}}>
      <iframe src={src} allowFullScreen style={{ border: 0 }} />
    </div>
  )
};
