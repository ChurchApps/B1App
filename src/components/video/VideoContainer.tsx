import React, { useEffect, useState } from "react";

import { SectionInterface, StreamingServiceExtendedInterface } from "@/helpers";
import { AppearanceHelper } from "@churchapps/apphelper";
import { useMountedState } from "@churchapps/apphelper";
import { StyleHelper } from "@churchapps/apphelper-website";
import { ConfigHelper, ConfigurationInterface } from "@/helpers/ConfigHelper";
import { useParams } from "next/navigation";

interface Props {
  currentService: StreamingServiceExtendedInterface | null, embedded: boolean;
  sections?: SectionInterface[];
  overlayContent: boolean;
}

type PageParams = { sdSlug: string }

export const VideoContainer: React.FC<Props> = (props) => {

  // Initialize with 0 to avoid hydration mismatch, then set actual time in useEffect
  const [currentTime, setCurrentTime] = React.useState(0);
  const [loadedTime, setLoadedTime] = React.useState(0);
  const [isClient, setIsClient] = React.useState(false);
  const isMounted = useMountedState();
  const [config, setConfig] = React.useState<ConfigurationInterface>(null);
  const [transparent, setTransparent] = useState(props.overlayContent);
  const params = useParams<PageParams>();

  const loadData = () => {
    ConfigHelper.load(params.sdSlug).then((data) => { setConfig(data); });
  };

  useEffect(() => {
    loadData();
  }, []);

  const getCountdownTime = (serviceTime: Date) => {
    let remainingSeconds = Math.floor((serviceTime.getTime() - currentTime) / 1000);
    if (remainingSeconds > 86400) return serviceTime.toDateString() + " - " + serviceTime.toLocaleString("en-US", { hour: "numeric", minute: "numeric", hour12: true });
    else {
      const hours = Math.floor(remainingSeconds / 3600);
      remainingSeconds = remainingSeconds - (hours * 3600);
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds - (minutes * 60);
      return ("0" + hours).slice(-2) + ":" + ("0" + minutes).slice(-2) + ":" + ("0" + seconds).slice(-2);
    }
  };

  const getVideo = (cs: StreamingServiceExtendedInterface) => {
    let videoUrl = cs?.sermon?.videoUrl || "";
    if (!videoUrl || videoUrl === "") {
      const logoUrl = getLogo();
      const style: React.CSSProperties = {
        height: "100%",
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        ...(logoUrl ? { backgroundImage: `url(${logoUrl})` } : {})
      };
      return <div id="noVideoContent" style={style} />;
    }

    if (cs.localStartTime !== undefined) {
      const seconds = Math.floor((loadedTime - cs.localStartTime.getTime()) / 1000);
      if (seconds > 10) {
        if (cs?.sermon?.videoType === "youtube") videoUrl += "&start=" + seconds.toString();
        if (cs?.sermon?.videoType === "vimeo") videoUrl += "#t=" + seconds.toString() + "s";
      } else {
        if (cs?.sermon?.videoType === "youtube") videoUrl += "&start=1";
        if (cs?.sermon?.videoType === "vimeo") videoUrl += "#t=0m0s";
      }
    }
    return (<iframe id="videoFrame" src={videoUrl} frameBorder={0} allow="autoplay; fullscreen" allowFullScreen title="Sermon Video"></iframe>);
  };

  const getCountdown = (cs: StreamingServiceExtendedInterface) => {
    const displayTime = getCountdownTime(cs.localCountdownTime || new Date());
    const logoUrl = getLogo();
    const style: React.CSSProperties = {
      height: "100%",
      backgroundSize: "contain",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      ...(logoUrl ? { backgroundImage: `url(${logoUrl})` } : {})
    };
    return <div id="noVideoContent" style={style}><h3 style={{ fontSize: 24, position: "absolute", bottom: 40, left: 20 }}>{cs?.sermon?.title ?? "Next Service Time"}</h3><p style={{ fontSize: 28, position: "absolute", bottom: 0, left: 20 }}>{displayTime}</p></div>;
  };

  const getLogo = () => {
    let logo: string | null = null;
    if (transparent) {
      const textColor = StyleHelper.getTextColor(props.sections[0]?.textColor, config?.globalStyles, config?.appearance);
      logo = AppearanceHelper.getLogoByTextColor(config?.appearance?.logoLight || null, config?.appearance?.logoDark || null, textColor);
    } else {
      logo = config?.appearance?.logoDark || null;
    }
    // Return null for any falsy value or the string "null"
    if (!logo || logo === "null") return null;
    return logo;
  };

  const contentType = React.useMemo(() => {
    // Don't calculate until client-side to avoid hydration mismatch
    if (!isClient) return "logo";

    const cs = props.currentService;
    const now = new Date();

    if (cs === undefined || cs === null || cs.localEndTime === undefined) {
      return "logo";
    } else if (now > cs.localEndTime) {
      return "ended";
    } else if (cs.localStartTime !== undefined && now <= cs.localStartTime) {
      return "countdown";
    } else {
      return "video";
    }
  }, [props.currentService, isClient]);

  const getContents = () => {
    const logoUrl = getLogo();
    // Only add backgroundImage if we have a valid URL to avoid url(null) requests
    const logoStyle: React.CSSProperties = {
      height: "100%",
      backgroundSize: "contain",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      ...(logoUrl ? { backgroundImage: `url(${logoUrl})` } : {})
    };

    switch (contentType) {
      case "logo": return <div id="noVideoContent" style={logoStyle} />;
      case "ended": return <div id="noVideoContent"><h3>The current service has ended.</h3></div>;
      case "countdown": return getCountdown(props.currentService);
      case "video": return getVideo(props.currentService);
      default: return <div id="noVideoContent" style={logoStyle} />;
    }
  };

  React.useEffect(() => {
    // Set initial times and mark as client-side
    const now = new Date().getTime();
    setCurrentTime(now);
    setLoadedTime(now);
    setIsClient(true);

    const updateCurrentTime = () => {
      if (isMounted()) {
        setCurrentTime(new Date().getTime());
      }
    };
    const id = setInterval(updateCurrentTime, 1000);
    return () => clearInterval(id);
  }, [isMounted]);

  return (
    <div id="videoContainer" className={(props.embedded) ? "embedded" : ""}>
      {getContents()}
    </div>
  );
};

