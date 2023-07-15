import { EnvironmentHelper } from "@/helpers";
import { Socket, io } from "socket.io-client";

export class SocketIO {
  private static socket: Socket;

  static getInstance(): Socket {
    if (SocketIO.socket) {
      return SocketIO.socket;
    }

    const socket = io(EnvironmentHelper.Common.MessagingApi);
    SocketIO.socket = socket;
    return socket;
  }
}
