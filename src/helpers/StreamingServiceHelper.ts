import { StreamConfigInterface, StreamingServiceExtendedInterface } from "./interfaces";


export class StreamingServiceHelper {
  static currentServiceChangedCallback: (currentService: StreamingServiceExtendedInterface | null) => void;
  static currentService: StreamingServiceExtendedInterface | null;
  static timer: NodeJS.Timeout;

  /*
  static checkService() {
    let cs;
    if (ConfigHelper.current !== undefined) {
      cs = StreamingServiceHelper.determineCurrentService(ConfigHelper.current.services);
    }
    if (JSON.stringify(cs) !== JSON.stringify(StreamingServiceHelper.currentService)) {
      StreamingServiceHelper.currentService = cs;
      if (StreamingServiceHelper.currentServiceChangedCallback !== undefined) StreamingServiceHelper.currentServiceChangedCallback(cs);
    }
  }

  static initTimer(callback: (currentService: StreamingServiceExtendedInterface | null) => void) {
    StreamingServiceHelper.currentServiceChangedCallback = callback;
    if (StreamingServiceHelper.timer !== undefined) clearInterval(StreamingServiceHelper.timer);
    StreamingServiceHelper.timer = setInterval(StreamingServiceHelper.checkService, 1000);
  }*/

  static updateServiceTimes(config: StreamConfigInterface) {
    if (config.services != null) {
      for (let i = 0; i < config.services.length; i++) {
        let s = config.services[i];
        s.localCountdownTime = new Date(new Date(s.serviceTime).getTime());
        s.localStartTime = new Date(s.localCountdownTime.getTime());
        s.localStartTime.setSeconds(s.localStartTime.getSeconds() - this.getSeconds(s.earlyStart));
        s.localEndTime = new Date(s.localStartTime.getTime());
        s.localEndTime.setSeconds(s.localEndTime.getSeconds() + s.sermon?.duration || 5400);
        s.localChatStart = new Date(s.localStartTime.getTime());
        s.localChatStart.setSeconds(s.localChatStart.getSeconds() - this.getSeconds(s.chatBefore));
        s.localChatEnd = new Date(s.localEndTime.getTime());
        s.localChatEnd.setSeconds(s.localChatEnd.getSeconds() + this.getSeconds(s.chatAfter));
      }
    }
  }

  static getSeconds(displayTime: string) {
    try {
      let parts = displayTime.split(":");
      let seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      return seconds;
    } catch (ex) { return 0; }
  }

  static determineCurrentService(services: StreamingServiceExtendedInterface[]) {
    let result = null;
    if (services !== undefined) {
      let currentTime = new Date();
      for (let i = 0; i < services.length; i++) {
        let s = services[i];
        if (s.localChatEnd !== undefined && s.localEndTime !== undefined) {
          if (currentTime <= s.localChatEnd) {
            if (result == null || (result.localEndTime === undefined || s.localEndTime < result.localEndTime)) result = s;
          }
        }
      }
    }
    return result;
  }

}

