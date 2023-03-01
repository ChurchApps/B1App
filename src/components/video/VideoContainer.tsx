import React from "react";

import { StreamingServiceExtendedInterface } from "@/helpers";
import useMountedState from "@/appBase/hooks/useMountedState";

interface Props { currentService: StreamingServiceExtendedInterface | null, embedded:boolean }

export const VideoContainer: React.FC<Props> = (props) => {

  const [currentTime, setCurrentTime] = React.useState(new Date().getTime());
  const [loadedTime, setLoadedTime] = React.useState(new Date().getTime());
  const isMounted = useMountedState();

  const getCountdownTime = (serviceTime: Date) => {
    let remainingSeconds = Math.floor((serviceTime.getTime() - currentTime) / 1000);
    if (remainingSeconds > 86400) return serviceTime.toDateString() + " - " + serviceTime.toLocaleString("en-US", { hour: "numeric", minute: "numeric", hour12: true })
    else {
      let hours = Math.floor(remainingSeconds / 3600);
      remainingSeconds = remainingSeconds - (hours * 3600);
      let minutes = Math.floor(remainingSeconds / 60);
      let seconds = remainingSeconds - (minutes * 60);
      return ("0" + hours).slice(-2) + ":" + ("0" + minutes).slice(-2) + ":" + ("0" + seconds).slice(-2);
    }
  }

  const getVideo = (cs: StreamingServiceExtendedInterface) => {
    let videoUrl = cs.sermon?.videoUrl || "";
    if (cs.localStartTime !== undefined) {
      let seconds = Math.floor((loadedTime - cs.localStartTime.getTime()) / 1000);
      if (seconds > 10) {
        if (cs?.sermon?.videoType === "youtube") videoUrl += "&start=" + seconds.toString();
        if (cs?.sermon?.videoType === "vimeo") videoUrl += "#t=" + seconds.toString() + "s";
      } else {
        if (cs?.sermon?.videoType === "youtube") videoUrl += "&start=0";
        if (cs?.sermon?.videoType === "vimeo") videoUrl += "#t=0m0s";
      }
    }
    return (<iframe id="videoFrame" src={videoUrl} frameBorder={0} allow="autoplay; fullscreen" allowFullScreen title="Sermon Video"></iframe>);
  }

  const getCountdown = (cs: StreamingServiceExtendedInterface) => {
    let displayTime = getCountdownTime(cs.localCountdownTime || new Date());
    return <div id="noVideoContent"><h2>Next Service Time</h2>{displayTime}</div>
  }

  const getContents = () => {
    //console.log("GET CONTENTS")
    let cs = props.currentService;
    if (cs === undefined || cs === null || cs.localEndTime === undefined) return <div id="noVideoContent"><h2>Check back for new services</h2></div>;
    else if (new Date() > cs.localEndTime) return <div id="noVideoContent"><h2>The current service has ended.</h2></div>;
    else {
      if (cs.localStartTime !== undefined && new Date() <= cs.localStartTime) return getCountdown(cs);
      else return getVideo(cs);
    }
  }
  React.useEffect(() => {
    const updateCurrentTime = () => {
      if (isMounted()) {
        setCurrentTime(new Date().getTime());
      }
    }
    setLoadedTime(new Date().getTime());
    setInterval(updateCurrentTime, 1000);
  }, [isMounted]);

  return (
    <div id="videoContainer" className={(props.embedded) ? "embedded" : ""}>
      {getContents()}
    </div>
  );
}

