import { ChatConfigHelper } from "./ChatConfigHelper";
import { StreamConfigInterface, StreamingServiceExtendedInterface } from "./interfaces";


export class StreamingServiceHelper {
  static listeners = new Set<(currentService: StreamingServiceExtendedInterface | null) => void>();
  static currentService: StreamingServiceExtendedInterface | null;
  static timer: NodeJS.Timeout | undefined;

  static checkService() {
    let cs: StreamingServiceExtendedInterface | null = null;
    if (ChatConfigHelper.current !== undefined) {
      cs = StreamingServiceHelper.determineCurrentService(ChatConfigHelper.current.services);
    }
    if (JSON.stringify(cs) !== JSON.stringify(StreamingServiceHelper.currentService)) {
      StreamingServiceHelper.currentService = cs;
      StreamingServiceHelper.listeners.forEach((listener) => listener(cs));
    }
  }

  static initTimer(callback: (currentService: StreamingServiceExtendedInterface | null) => void) {
    StreamingServiceHelper.listeners.add(callback);
    if (StreamingServiceHelper.currentService !== undefined) callback(StreamingServiceHelper.currentService);
    if (StreamingServiceHelper.timer === undefined) StreamingServiceHelper.timer = setInterval(StreamingServiceHelper.checkService, 1000);
    return () => {
      StreamingServiceHelper.listeners.delete(callback);
      if (StreamingServiceHelper.listeners.size === 0 && StreamingServiceHelper.timer !== undefined) {
        clearInterval(StreamingServiceHelper.timer);
        StreamingServiceHelper.timer = undefined;
      }
    };
  }

  static updateServiceTimes(config: StreamConfigInterface) {
    if (config.services != null) {
      for (let i = 0; i < config.services.length; i++) {
        const s = config.services[i];
        s.localCountdownTime = new Date(new Date(s.serviceTime).getTime());
        s.localStartTime = new Date(s.localCountdownTime.getTime());
        s.localStartTime.setSeconds(s.localStartTime.getSeconds() - this.getSeconds(s.earlyStart));
        s.localEndTime = new Date(s.localStartTime.getTime());
        s.localEndTime.setSeconds(s.localEndTime.getSeconds() + (s.sermon?.duration || 5400));
        s.localChatStart = new Date(s.localStartTime.getTime());
        s.localChatStart.setSeconds(s.localChatStart.getSeconds() - this.getSeconds(s.chatBefore));
        s.localChatEnd = new Date(s.localEndTime.getTime());
        s.localChatEnd.setSeconds(s.localChatEnd.getSeconds() + this.getSeconds(s.chatAfter));
      }
    }
  }

  static getSeconds(displayTime: string) {
    try {
      const parts = displayTime.split(":");
      const seconds = parseInt(parts[0]) * 60 + (parseInt(parts[1]) || 0);
      return isNaN(seconds) ? 0 : seconds;
    } catch (ex) { return 0; }
  }

  static determineCurrentService(services: StreamingServiceExtendedInterface[] | undefined) {
    let result = null;
    if (services !== undefined) {
      const currentTime = new Date();
      for (let i = 0; i < services.length; i++) {
        const s = services[i];
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

