import { SocketHelper } from "./SocketHelper";
import Cookies from "js-cookie";
import { ApiHelper, ChatAttendanceInterface, ChatRoomInterface, ChatStateInterface, ChatUserInterface, ConnectionInterface, ConversationInterface, MessageInterface } from "."
import { ChatConfigHelper } from "./ChatConfigHelper";

export class ChatHelper {

  static current: ChatStateInterface = { chatEnabled: false, mainRoom: null, hostRoom: null, privateRooms: [], user: { firstName: "Anonymous", lastName: "", isHost: false } };
  static onChange: () => void;

  static createRoom = (conversation: ConversationInterface): ChatRoomInterface => ({
    //title: title,
    messages: [],
    attendance: { conversationId: conversation.id, totalViewers: 0, viewers: [] },
    callout: { content: "" },
    //conversationId: conversationId,
    //contentId: contentId || "",
    conversation: conversation,
    joined: false
  })

  static initChat = async () => {

    SocketHelper.actionHandlers = [];
    SocketHelper.actionHandlers.push({ action: "attendance", handleMessage: ChatHelper.handleAttendance });
    SocketHelper.actionHandlers.push({ action: "callout", handleMessage: ChatHelper.handleCallout });
    SocketHelper.actionHandlers.push({ action: "delete", handleMessage: ChatHelper.handleDelete });
    SocketHelper.actionHandlers.push({ action: "message", handleMessage: ChatHelper.handleMessage });
    SocketHelper.actionHandlers.push({ action: "prayerRequest", handleMessage: ChatHelper.handlePrayerRequest });
    SocketHelper.actionHandlers.push({ action: "privateMessage", handleMessage: ChatHelper.handlePrivateMessage });
    SocketHelper.actionHandlers.push({ action: "privateRoomAdded", handleMessage: ChatHelper.handlePrivateRoomAdded });
    SocketHelper.actionHandlers.push({ action: "videoChatInvite", handleMessage: ChatHelper.handleVideoChatInvite });
    SocketHelper.actionHandlers.push({ action: "disconnect", handleMessage: ChatHelper.handleDisconnect });
    SocketHelper.init();
    /*
    {
      attendanceHandler: ChatHelper.handleAttendance,
      calloutHandler: ChatHelper.handleCallout,
      deleteHandler: ChatHelper.handleDelete,
      messageHandler: ChatHelper.handleMessage,
      prayerRequestHandler: ChatHelper.handlePrayerRequest,
      disconnectHandler: ChatHelper.handleDisconnect,
      privateMessageHandler: ChatHelper.handlePrivateMessage,
      privateRoomAddedHandler: ChatHelper.handlePrivateRoomAdded,
      videoChatInviteHandler: ChatHelper.handleVideoChatInvite
    }*/
  }

  static handleDisconnect = () => {
    setTimeout(() => {
      console.log("RECONNECTING");
      //Silently reconnect
      console.log(SocketHelper.socket.readyState, SocketHelper.socket.CLOSED)
      if (SocketHelper.socket.readyState === SocketHelper.socket.CLOSED) {
        console.log("TRYING?")
        ChatHelper.initChat().then(() => {
          console.log("JOINING ROOM")
          const mRoom = ChatHelper.current.mainRoom;
          ChatHelper.joinRoom(mRoom.conversation.id, ChatConfigHelper.current.churchId);
        });
      }
    }, 1000);

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
    const rooms = [ChatHelper.current.mainRoom, ChatHelper.current.hostRoom];
    ChatHelper.current.privateRooms.forEach(r => rooms.push(r));
    rooms.forEach(room => {
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
    let privateRoom: ChatRoomInterface = null;
    ChatHelper.current.privateRooms.forEach(pr => {
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
      messages.forEach(m => {
        switch (m.messageType) {
          case "message": ChatHelper.handleMessage(m); break;
          case "callout": ChatHelper.handleCallout(m); break;
        }
      });
    }
  }

  static getRoom = (conversationId: string): ChatRoomInterface => {
    const c = ChatHelper.current;
    let result: ChatRoomInterface = null;
    if (c.mainRoom?.conversation.id === conversationId) result = c.mainRoom;
    else if (c.hostRoom?.conversation.id === conversationId) result = c.hostRoom;
    else c.privateRooms.forEach(r => { if (r.conversation.id === conversationId) result = r; });
    return result;
  }

  static insertLinks(text: string) {
    let exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/ig;
    return text.replace(exp, "<a href='$1' target='_blank'>$1</a>");
  }

  static getUser() {
    let name = Cookies.get("displayName");
    if (name === undefined || name === null || name === "") { name = "Anonymous"; Cookies.set("displayName", name); }
    const [firstName, lastName] = name.split(" ");
    let result: ChatUserInterface = { firstName, lastName: lastName || "", isHost: false };
    ChatHelper.current.user = result;
    return result;
  }

  static joinRoom(conversationId: string, churchId: string) {
    const { firstName, lastName } = ChatHelper.current.user;
    const connection: ConnectionInterface = { conversationId: conversationId, churchId: churchId, displayName: `${firstName} ${lastName}`, socketId: SocketHelper.socketId }
    ApiHelper.postAnonymous("/connections", [connection], "MessagingApi");
    ApiHelper.getAnonymous("/messages/catchup/" + churchId + "/" + conversationId, "MessagingApi").then(messages => { ChatHelper.handleCatchup(messages) });
  }

}

