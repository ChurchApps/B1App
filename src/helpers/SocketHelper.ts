import { ArrayHelper, ChatEventsInterface, ChatPayloadInterface, EnvironmentHelper, SocketActionHandlerInterface } from "."


export class SocketHelper {
  static socket: WebSocket;
  static socketId: string;

  //static events: ChatEventsInterface;

  static actionHandlers: SocketActionHandlerInterface[] = [];

  static init = async () => {
    //SocketHelper.events = events;
    if (SocketHelper.socket !== undefined) {
      console.log("SOCKET EXISTS", SocketHelper.socket, SocketHelper.socket.readyState);
      try { SocketHelper.socket.close(); } catch (e) { console.log(e); }
    }

    await new Promise((resolve) => {
      SocketHelper.socket = new WebSocket(EnvironmentHelper.Common.MessagingApiSocket);
      SocketHelper.socket.onmessage = (event) => {
        console.log("***MESSAGE");
        const payload = JSON.parse(event.data);
        SocketHelper.handleMessage(payload);
      };
      SocketHelper.socket.onopen = async (e) => {
        console.log("***ONOPEN");
        SocketHelper.socket.send("getId");
        setTimeout(() => { resolve(null); }, 500);
      };
      SocketHelper.socket.onclose = async (e) => {
        console.log("***ONCLOSE");
        //SocketHelper.events.disconnectHandler();
        SocketHelper.handleMessage({ action: "disconnect", data: null, churchId:null, conversationId:null })
      }
    });
  }

  static handleMessage = (payload: ChatPayloadInterface) => {
    console.log("payload", payload);

    ArrayHelper.getAll(SocketHelper.actionHandlers, "action", payload.action).forEach((handler) => {
      handler.handleMessage(payload.data);
    });
    /*
    switch (payload.action) {
      case "attendance": SocketHelper.events.attendanceHandler(payload.data); break;
      case "callout": SocketHelper.events.calloutHandler(payload.data); break;
      case "deleteMessage": SocketHelper.events.deleteHandler(payload.data); break;
      case "message": SocketHelper.events.messageHandler(payload.data); break;
      case "prayerRequest": SocketHelper.events.prayerRequestHandler(payload.data); break;
      case "privateMessage": SocketHelper.events.privateMessageHandler(payload.data); break;
      case "privateRoomAdded": SocketHelper.events.privateRoomAddedHandler(payload.data); break;
      case "videoChatInvite": SocketHelper.events.videoChatInviteHandler(payload.data); break;
      case "socketId":
        SocketHelper.socketId = payload.data;
        break;
    }*/

  }

}

