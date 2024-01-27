import { useState, useEffect, useRef, ReactNode } from "react";
import YouTube, { YouTubeProps } from "react-youtube";
import styles from "styles/youtubeBackground.module.css";

interface Props extends YouTubeProps {
  children?: ReactNode;
  overlay?: string;
  playerOptions?: {};
  aspectRatio?: any;
  noCookie?: boolean;
  contentClassName?: string;
}

export function YoutubeBackground({
  children,
  overlay = "false",
  noCookie = false,
  playerOptions = {},
  style,
  className,
  aspectRatio = "16:9",
  contentClassName,
  ...rest
}: Props) {
  const [videoHeight, setVideoHeight] = useState(10);
  const [videoWidth, setVideoWidth] = useState(10);
  const [videoY, setVideoY] = useState(0);
  const [videoX, setVideoX] = useState(0);
  const containerRef = useRef<any>(null);

  if (typeof aspectRatio === "string") {
    const split = aspectRatio.split(":");
    aspectRatio = parseInt(split[0]) / parseInt(split[1]);
  }

  /*
  const [{ canDrop }] = useDrop(
    () => ({
      accept: ["element", "elementBlock"],
      collect: (monitor) => ({
        canDrop: !!monitor.canDrop(),
      }),
    }), []
  );
  */


  useEffect(() => {
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  });

  const updateDimensions = () => {
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const containerAspectRatio = containerWidth / containerHeight;

    let videoHeight = containerHeight;
    let videoWidth = containerWidth;
    let videoY = 0;
    let videoX = 0;

    if (containerAspectRatio > aspectRatio) {
      videoHeight = containerWidth / aspectRatio;
      videoY = (videoHeight - containerHeight) / -2;
    } else {
      videoWidth = containerHeight * aspectRatio;
      videoX = (videoWidth - containerWidth) / -2;
    }

    setVideoHeight(videoHeight);
    setVideoWidth(videoWidth);
    setVideoX(videoX);
    setVideoY(videoY);
  };

  const defaultPlayerVars = {
    autoplay: 1,
    controls: 0,
    rel: 0,
    showinfo: 0,
    mute: 1,
    modestbranding: 1,
    iv_load_policy: 3,
    playsinline: 1,
  };

  const videoOptions = {
    playerVars: {
      ...defaultPlayerVars,
      ...playerOptions,
    },
    host: noCookie ? 'https://www.youtube-nocookie.com' : 'https://www.youtube.com'
  };

  return (
    <div style={style} ref={containerRef} className={[styles.container, className].join(" ")}>
      <div style={{ zIndex: 2, position: "relative" }} className={contentClassName}>{children}</div>
      <div
        className={styles.videoContainer}
        style={{
          width: videoWidth + "px",
          height: (videoHeight + 130) + "px",
          top: (videoY + -65) + "px",
          left: videoX + "px",
        }}
      >
        {overlay && <div className={styles.overlay} style={{ backgroundColor: overlay }}></div>}
        {<YouTube
          {...rest}
          onReady={(e) => {
            e.target.playVideo();
            rest?.onReady && rest.onReady(e);
          }}
          onEnd={(e) => {
            e.target.playVideo();
            rest?.onEnd && rest.onEnd(e);
          }}
          opts={videoOptions}
          className={styles.videoInnerContainer}
          iframeClassName={styles.videoIframe}
        />}
      </div>
    </div>
  );
}
