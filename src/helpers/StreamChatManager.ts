import Cookies from "js-cookie";
import { ChatHelper } from "./ChatHelper";
import { ChatStateInterface, StreamConfigInterface, StreamingServiceExtendedInterface } from "./interfaces";
import { SocketHelper, ConversationInterface, ApiHelper, UserHelper } from "@churchapps/apphelper";

export class StreamChatManager {

  private static blockedIps: Map<string, Set<string>> = new Map();

  public static blockIp(serviceId: string, ipAddress: string) {
    if (!this.blockedIps.has(serviceId)) {
      this.blockedIps.set(serviceId, new Set());
    }
    this.blockedIps.get(serviceId).add(ipAddress);

    const payload = { action: "updatedBlockedIps", data: { serviceId, blockedIps: Array.from(this.blockedIps.get(serviceId)) } };
    SocketHelper.socket.send(JSON.stringify(payload))
    ChatHelper.onChange();
  }

  public static unBlockIp(serviceId: string, ipAddress: string) {
    if (this.blockedIps.has(serviceId)) {
      this.blockedIps.get(serviceId).delete(ipAddress);

      const payload = { action: "updatedBlockedIps", data: {serviceId, blockedIps: Array.from(this.blockedIps.get(serviceId)) } };
      SocketHelper.socket.send(JSON.stringify(payload));
      ChatHelper.onChange();
    }
  }

  public static getBlockedIps(serviceId: string): string[] {
    return Array.from(this.blockedIps.get(serviceId) || new Set());
  }

  private static async getIpAddress(): Promise<string> {
    try {
      const response = await fetch("https://api.ipify.org/?format=json");
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.log("Error fetching IP Address: ", error);
      return "";
    }
  }

  public static isIpBlocked(serviceId: string, ipAdress: string): boolean {
    return this.blockedIps.get(serviceId)?.has(ipAdress) || false;
  }

  public static initBlockedIpsHandler() {
    SocketHelper.addHandler("updatedBlockedIps", "chatBlockedIps", (data) => {
      if (Array.isArray(data)) {
        data.forEach(({ serviceId, blockedIps }) => {
          this.blockedIps.set(serviceId, new Set(blockedIps));
        });
      } else {
        const { serviceId, blockedIps } = data;
        this.blockedIps.set(serviceId, new Set(blockedIps));
      }
      ChatHelper.onChange();
    })
  }

  public static async joinMainRoom(churchId: string, currentService: StreamingServiceExtendedInterface, setChatState:(state:ChatStateInterface) => void) {
    if (currentService) {
      const conversation: ConversationInterface = await ApiHelper.getAnonymous("/conversations/current/" + churchId + "/streamingLive/" + currentService.id, "MessagingApi");
      ChatHelper.current.mainRoom = ChatHelper.createRoom(conversation);
      ChatHelper.current.mainRoom.conversation.title = "Chat";
      setChatState(ChatHelper.current);
      ChatHelper.joinRoom(conversation.id, conversation.churchId);
      ChatHelper.current.mainRoom.joined = true;
    }
  }

  public static handleNameUpdate(displayName: string) {
    //const displayName = `${firstName} ${lastName}`
    const data = { socketId: SocketHelper.socketId, name: displayName };
    ApiHelper.postAnonymous("/connections/setName", data, "MessagingApi");
    ChatHelper.current.user.firstName = displayName;
    ChatHelper.current.user.lastName = "";
    Cookies.set("displayName", displayName);
    ChatHelper.onChange();
  }


  public static async checkHost(d: StreamConfigInterface, currentServiceId:string, chatState: ChatStateInterface, setChatState:(state: ChatStateInterface) => void) {
    if (chatState?.user?.isHost) {
      const hostChatDetails = await ApiHelper.get("/streamingServices/" + currentServiceId + "/hostChat", "ContentApi");
      if (hostChatDetails.room) {
        d.tabs.push({ type: "hostchat", text: "Host Chat", icon: "group", data: "", url: "" });
        const hostConversation: ConversationInterface = await ApiHelper.get("/conversations/current/" + d.churchId + "/streamingLiveHost/" + hostChatDetails.room, "MessagingApi");
        ChatHelper.current.hostRoom = ChatHelper.createRoom(hostConversation);
        ChatHelper.current.hostRoom.conversation.title = "Host Chat";
        setChatState(ChatHelper.current);
        setTimeout(() => {
          ChatHelper.joinRoom(hostConversation.id, hostConversation.churchId);
          ChatHelper.current.hostRoom.joined = true;
        }, 500);
      }
    }
  }

  public static async initUser () {
    const chatUser = ChatHelper.getUser();
    chatUser.ipAddress = await this.getIpAddress();
    if (ApiHelper.isAuthenticated) {
      const { firstName, lastName } = UserHelper.user;
      chatUser.firstName = firstName || "Anonymous";
      chatUser.lastName = lastName || "";
      ChatHelper.current.user = chatUser;
      ChatHelper.onChange();
    }
  }

}

