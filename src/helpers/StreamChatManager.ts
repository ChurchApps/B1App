import Cookies from "js-cookie";
import { ChatHelper } from "./ChatHelper";
import { ChatUserInterface, StreamConfigInterface, StreamingServiceExtendedInterface } from "./interfaces";
import { ApiHelper, ConversationStore, PresenceStore, SocketHelper, SubscriptionManager, UserHelper } from "@churchapps/apphelper";
import { Permissions } from "@churchapps/helpers";
import type { ConversationInterface } from "@churchapps/helpers";

export class StreamChatManager {

  // Boot the unified delivery primitives directly. NotificationService.initialize
  // requires authenticated person/church context, which anonymous viewers lack.
  static async initStream(): Promise<void> {
    await SocketHelper.init();
    ConversationStore.ensureHandlers();
    PresenceStore.ensureHandlers();
    SubscriptionManager.setupRejoin();
  }

  static async joinMainRoom(churchId: string, currentService: StreamingServiceExtendedInterface): Promise<ConversationInterface | null> {
    if (!currentService) return null;
    const conversation: ConversationInterface = await ApiHelper.getAnonymous(`/conversations/current/${churchId}/streamingLive/${currentService.id}`, "MessagingApi");
    conversation.title = "Chat";
    ChatHelper.current.mainConversation = conversation;
    await StreamChatManager.joinRoom(conversation);
    return conversation;
  }

  static async checkHost(d: StreamConfigInterface, currentServiceId: string): Promise<ConversationInterface | null> {
    if (!ChatHelper.current.user.isHost) return null;
    const hostChatDetails = await ApiHelper.get(`/streamingServices/${currentServiceId}/hostChat`, "ContentApi");
    if (!hostChatDetails?.room) return null;
    if (!d.tabs?.some(t => t.type === "hostchat")) {
      d.tabs?.push({ type: "hostchat", text: "Host Chat", icon: "group", data: "", url: "" });
    }
    const conversation: ConversationInterface = await ApiHelper.get(`/conversations/current/${d.churchId}/streamingLiveHost/${encodeURIComponent(hostChatDetails.room)}`, "MessagingApi");
    conversation.title = "Host Chat";
    ChatHelper.current.hostConversation = conversation;
    await StreamChatManager.joinRoom(conversation);
    return conversation;
  }

  static async joinRoom(conversation: ConversationInterface): Promise<void> {
    if (!conversation?.id || !conversation.churchId) return;
    const { firstName, lastName } = ChatHelper.current.user;
    const displayName = `${firstName}${lastName ? " " + lastName : ""}`;
    await Promise.all([
      SubscriptionManager.joinRoom(conversation.id, conversation.churchId, undefined, displayName),
      ConversationStore.loadByConversationId(conversation.id, conversation.churchId)
    ]);
  }

  static async leaveRoom(conversation: ConversationInterface): Promise<void> {
    if (!conversation?.id || !conversation.churchId) return;
    await SubscriptionManager.leaveRoom(conversation.id, conversation.churchId);
    ConversationStore.forget(conversation.id);
    PresenceStore.forget(conversation.id);
  }

  static updateName(displayName: string): ChatUserInterface {
    if (SocketHelper.socketId) {
      ApiHelper.postAnonymous("/connections/setName", { socketId: SocketHelper.socketId, name: displayName }, "MessagingApi");
    }
    Cookies.set("displayName", displayName);
    const [firstName, ...rest] = displayName.split(" ");
    ChatHelper.current.user = { ...ChatHelper.current.user, firstName, lastName: rest.join(" ") };
    return ChatHelper.current.user;
  }

  static initUser(): ChatUserInterface {
    const user = ChatHelper.getUser();
    if (ApiHelper.isAuthenticated && UserHelper.user) {
      const { firstName, lastName } = UserHelper.user;
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || "";
      user.isHost = UserHelper.checkAccess(Permissions.contentApi.chat.host);
      ChatHelper.current.user = user;
    }
    return user;
  }
}
