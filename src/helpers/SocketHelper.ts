import { ArrayHelper, EnvironmentHelper, SocketActionHandlerInterface, SocketPayloadInterface } from "."


export class SocketHelper {
  static socket: WebSocket;
  static socketId: string;
  static actionHandlers: SocketActionHandlerInterface[] = [];

  static init = async () => {
    if (SocketHelper.socket !== undefined) {
      try { SocketHelper.socket.close(); } catch (e) { console.log(e); }
    }

    await new Promise((resolve) => {
      SocketHelper.socket = new WebSocket(EnvironmentHelper.Common.MessagingApiSocket);
      SocketHelper.socket.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        SocketHelper.handleMessage(payload);
      };
      SocketHelper.socket.onopen = async (e) => {
        SocketHelper.socket.send("getId");
        setTimeout(() => { resolve(null); }, 500);
      };
      SocketHelper.socket.onclose = async (e) => {
        //SocketHelper.events.disconnectHandler();
        setTimeout(() => {
          //Silently reconnect
          if (SocketHelper.socket.readyState === SocketHelper.socket.CLOSED) {
            SocketHelper.init().then(() => {
              SocketHelper.handleMessage({ action: "reconnect", data: null })
            });
          }
        }, 1000);

        //SocketHelper.handleMessage({ action: "disconnect", data: null })
      }
    });
  }

  static addHandler = (action: string, id: string, handleMessage: (data: any) => void) => {
    const existing = ArrayHelper.getOne(SocketHelper.actionHandlers, "id", id);
    if (existing !== null) existing.handleMessage = handleMessage;
    else SocketHelper.actionHandlers.push({ action, id, handleMessage });
  }

  static handleMessage = (payload: SocketPayloadInterface) => {
    if (payload.action==="socketId") {
      SocketHelper.socketId = payload.data;
    }
    else {
      ArrayHelper.getAll(SocketHelper.actionHandlers, "action", payload.action).forEach((handler) => {
        handler.handleMessage(payload.data);
      });
    }
  }

}
