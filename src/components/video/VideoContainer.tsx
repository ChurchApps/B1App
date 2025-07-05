import React, { useEffect, useState } from "react";

import { SectionInterface, StreamingServiceExtendedInterface } from "@/helpers";
import { AppearanceHelper } from "@churchapps/apphelper/dist/helpers/AppearanceHelper";
import { useMountedState } from "@churchapps/apphelper/dist/helpers/useMountedState";
import { StyleHelper } from "@/helpers/StyleHelper";
import { ConfigHelper, ConfigurationInterface } from "@/helpers/ConfigHelper";
import { useParams } from "next/navigation";

interface Props {
  currentService: StreamingServiceExtendedInterface | null, embedded: boolean;
  sections?: SectionInterface[];
  overlayContent: boolean;
}

type PageParams = { sdSlug: string }

export const VideoContainer: React.FC<Props> = (props) => {

  const [currentTime, setCurrentTime] = React.useState(new Date().getTime());
  const [loadedTime, setLoadedTime] = React.useState(new Date().getTime());
  const isMounted = useMountedState();
  const [config, setConfig] = React.useState<ConfigurationInterface>(null);
  const [transparent, setTransparent] = useState(props.overlayContent);
  const params = useParams<PageParams>()

  const loadData = () => {
    ConfigHelper.load(params.sdSlug).then((data) => { setConfig(data); });
  };

  useEffect(() => {
    loadData();
  }, []);

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
        if (cs?.sermon?.videoType === "youtube") videoUrl += "&start=1";
        if (cs?.sermon?.videoType === "vimeo") videoUrl += "#t=0m0s";
      }
    }
    return (<iframe id="videoFrame" src={videoUrl} frameBorder={0} allow="autoplay; fullscreen" allowFullScreen title="Sermon Video"></iframe>);
  }

  const getCountdown = (cs: StreamingServiceExtendedInterface) => {
    let displayTime = getCountdownTime(cs.localCountdownTime || new Date());
    return <div id="noVideoContent" style={{ backgroundImage: `url(${getLogo()})`, height: "100%", backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center" }}><h3 style={{ fontSize: 24, position: "absolute", bottom: 40, left: 20 }}>{cs?.sermon?.title ?? "Next Service Time"}</h3><p style={{ fontSize: 28, position: "absolute", bottom: 0, left: 20 }}>{displayTime}</p></div>
  }

  const getLogo = () => {
    if (transparent) {
      const textColor = StyleHelper.getTextColor(props.sections[0]?.textColor, config?.globalStyles, config?.appearance);
      const logo = AppearanceHelper.getLogoByTextColor(config?.appearance?.logoLight || null, config?.appearance?.logoDark || null, textColor);
      return logo !== "" ? logo : null;
    }
    else return config?.appearance?.logoDark || null;
  }

  const getContents = () => {
    let cs = props.currentService;
    if (cs === undefined || cs === null || cs.localEndTime === undefined) return <div id="noVideoContent" style={{ backgroundImage: `url(${getLogo()})`, height: "100%", backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center" }} />;
    else if (new Date() > cs.localEndTime) return <div id="noVideoContent"><h3>The current service has ended.</h3></div>;
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

