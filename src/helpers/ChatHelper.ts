import { SocketHelper } from "@churchapps/apphelper";
import { ApiHelper } from "@churchapps/apphelper";
import type { ConnectionInterface } from "@churchapps/helpers";
import type { ConversationInterface } from "@churchapps/helpers";
import type { MessageInterface } from "@churchapps/helpers";
import Cookies from "js-cookie";
import { ChatAttendanceInterface, ChatBlockedInterface, ChatRoomInterface, ChatStateInterface, ChatUserInterface } from "."
import { ChatConfigHelper } from "./ChatConfigHelper";
import { StreamChatManager } from "./StreamChatManager";

export class ChatHelper {

  static current: ChatStateInterface = { chatEnabled: false, mainRoom: null, hostRoom: null, privateRooms: [], user: { firstName: "Anonymous", lastName: "", isHost: false, isBlocked: false } };
  static onChange: () => void;

  static createRoom = (conversation: ConversationInterface): ChatRoomInterface => ({
    messages: [],
    attendance: { conversationId: conversation.id, totalViewers: 0, viewers: [] },
    callout: { content: "" },
    conversation: conversation,
    joined: false,
    blockedIps: []
  })

  private static initializing = false;

  static initChat = async () => {
    // If socket is already connected and has a socketId, no need to reinitialize
    if (SocketHelper.isConnected?.() && SocketHelper.socketId) {
      return;
    }

    // Prevent concurrent initialization attempts
    if (ChatHelper.initializing) return;
    ChatHelper.initializing = true;

    // Init socket first - catch errors so they don't break the page
    try {
      await SocketHelper.init();
    } catch {
      // Socket init failed - allow retry
      ChatHelper.initializing = false;
      return;
    }

    // Register handlers AFTER init (init calls cleanup which clears handlers in npm version)
    SocketHelper.addHandler("attendance", "chatAttendance", ChatHelper.handleAttendance);
    SocketHelper.addHandler("callout", "chatCallout", ChatHelper.handleCallout);
    SocketHelper.addHandler("deleteMessage", "chatDelete", ChatHelper.handleDelete);
    SocketHelper.addHandler("message", "chatMessage", ChatHelper.handleMessage);
    SocketHelper.addHandler("prayerRequest", "chatPrayerRequest", ChatHelper.handlePrayerRequest);
    SocketHelper.addHandler("privateMessage", "chatPrivateMessage", ChatHelper.handlePrivateMessage);
    SocketHelper.addHandler("privateRoomAdded", "chatPrivateRoomAdded", ChatHelper.handlePrivateRoomAdded);
    SocketHelper.addHandler("videoChatInvite", "chatVideoChatInvite", ChatHelper.handleVideoChatInvite);
    SocketHelper.addHandler("reconnect", "chatReconnect", ChatHelper.handleReconnect);
    SocketHelper.addHandler("blockedIp", "chatBlockedIp", ChatHelper.handleBlockedIps);

    ChatHelper.initializing = false;
  }

  static handleReconnect = () => {
    const mRoom = ChatHelper.current?.mainRoom;

    if (mRoom?.conversation?.id) {
      ChatHelper.joinRoom(mRoom.conversation.id, ChatConfigHelper.current.churchId);
    } else {
      console.error("mRoom or conversation is null or undefined.");

    }
    // ChatHelper.joinRoom(mRoom.conversation.id, ChatConfigHelper.current.churchId);
  }

  static handleAttendance = (attendance: ChatAttendanceInterface) => {
    const room = ChatHelper.getRoom(attendance.conversationId);
    if (room !== null) {
      room.attendance = attendance;
      ChatHelper.onChange();
    }
  }

  static handleCallout = (message: MessageInterface) => {
    const room = ChatHelper.getRoom(message.conversationId);
    if (room !== null) {
      room.callout = message;
      ChatHelper.onChange();
    }
  }

  static handleDelete = (messageId: string) => {
    const rooms: (ChatRoomInterface | null)[] = [ChatHelper.current.mainRoom, ChatHelper.current.hostRoom];
    ChatHelper.current.privateRooms.forEach((r: ChatRoomInterface) => rooms.push(r));
    rooms.forEach((room: ChatRoomInterface | null) => {
      if (room !== null) {
        for (let i = room.messages.length - 1; i >= 0; i--) {
          if (room.messages[i].id === messageId) room.messages.splice(i, 1);
        }
      }
    });
    ChatHelper.onChange();
  }

  static handleMessage = (message: MessageInterface) => {
    const room = ChatHelper.getRoom(message.conversationId);
    if (room !== null) {
      room.messages.push(message);
      switch (room) {
        case ChatHelper.current.mainRoom:
          ChatConfigHelper.setTabUpdated("chat");
          break;
        case ChatHelper.current.hostRoom:
          ChatConfigHelper.setTabUpdated("hostchat");
          break;
        default:
          ChatConfigHelper.setTabUpdated("prayer");
          break;
      }
      ChatHelper.onChange();
    }
  }

  static handlePrayerRequest = (conversation: ConversationInterface) => {
    const room = ChatHelper.current.hostRoom;
    if (room.prayerRequests === undefined) room.prayerRequests = [];
    room.prayerRequests.push(conversation);
    ChatConfigHelper.setTabUpdated("prayer");
    ChatHelper.onChange();
  }

  static handleVideoChatInvite = (roomName: string) => {
    ChatConfigHelper.current.jitsiRoom = roomName;
    ChatHelper.onChange();
  }

  static handlePrivateMessage = (conversation: ConversationInterface) => {
    const privateRoom = ChatHelper.createRoom(conversation);
    privateRoom.conversation.title = "Private Chat";
    privateRoom.joined = true;
    ChatHelper.current.privateRooms.push(privateRoom);
    ChatConfigHelper.addMissingPrivateTab();
    ChatHelper.onChange();
    ChatHelper.joinRoom(conversation.id, conversation.churchId);

    ChatConfigHelper.setTabUpdated("prayer");
  }

  static getOrCreatePrivateRoom = (conversation: ConversationInterface) => {
    let privateRoom: ChatRoomInterface | null = null;
    ChatHelper.current.privateRooms.forEach((pr: ChatRoomInterface) => {
      if (pr.conversation.id === conversation.id) privateRoom = pr;
    });

    if (privateRoom === null) {
      privateRoom = ChatHelper.createRoom(conversation);
      ChatHelper.current.privateRooms.push(privateRoom);
      ChatHelper.onChange();
    }
    return privateRoom;
  }

  static handlePrivateRoomAdded = (conversation: ConversationInterface) => {
    ChatHelper.getOrCreatePrivateRoom(conversation);
  }

  static handleCatchup = (messages: MessageInterface[]) => {
    if (messages.length > 0) {
      const room = ChatHelper.getRoom(messages[0].conversationId);
      room.messages = [];
      messages.forEach((m: MessageInterface) => {
        switch (m.messageType) {
          case "message": ChatHelper.handleMessage(m); break;
          case "callout": ChatHelper.handleCallout(m); break;
        }
      });
    }
  }

  static async handleBlockedIps(blockedIps: ChatBlockedInterface) {
    const room = ChatHelper.getRoom(blockedIps.conversationId);
    if (room !== null) {
      room.blockedIps = blockedIps.ipAddresses
      const currentUserIp = await StreamChatManager.getIpAddress();
      ChatHelper.current.user.isBlocked = StreamChatManager.isIpBlocked(currentUserIp);
      ChatHelper.onChange();
    }
  }

  static getRoom = (conversationId: string): ChatRoomInterface => {
    const c = ChatHelper.current;
    let result: ChatRoomInterface | null = null;
    if (c.mainRoom?.conversation.id === conversationId) result = c.mainRoom;
    else if (c.hostRoom?.conversation.id === conversationId) result = c.hostRoom;
    else c.privateRooms.forEach((r: ChatRoomInterface) => { if (r.conversation.id === conversationId) result = r; });
    return result;
  }

  static insertLinks(text: string) {
    const escapeHtml = (str: string) => str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    const exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/ig;
    const escapedText = escapeHtml(text);
    return escapedText.replace(exp, (match) => {
      const safeUrl = encodeURI(decodeURI(match));
      return `<a href='${safeUrl}' target='_blank' rel='noopener noreferrer'>${match}</a>`;
    });
  }

  static getUser() {
    let name = Cookies.get("displayName");
    if (name === undefined || name === null || name === "") { name = "Anonymous"; Cookies.set("displayName", name); }
    const [firstName, lastName] = name.split(" ");
    let result: ChatUserInterface = { firstName, lastName: lastName || "", isHost: false };
    ChatHelper.current.user = result;
    return result;
  }

  static async joinRoom(conversationId: string, churchId: string) {
    // Wait for socketId to be available (max 5 seconds)
    let attempts = 0;
    while (!SocketHelper.socketId && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!SocketHelper.socketId) return;

    const { firstName, lastName } = ChatHelper.current.user;
    const ipAddress = await StreamChatManager.getIpAddress();
    const connection: ConnectionInterface = { conversationId: conversationId, churchId: churchId, displayName: `${firstName} ${lastName}`, socketId: SocketHelper.socketId, ipAddress: ipAddress }

    ApiHelper.postAnonymous("/connections", [connection], "MessagingApi").then((c: ConnectionInterface[]) => {
      if (connection.displayName.includes("Anonymous ")) {
        ChatHelper.current.user.firstName = c[0].displayName;
        ChatHelper.onChange();
      }
    });
    ApiHelper.getAnonymous("/messages/catchup/" + churchId + "/" + conversationId, "MessagingApi").then((messages: MessageInterface[]) => { ChatHelper.handleCatchup(messages) });
  }

}

