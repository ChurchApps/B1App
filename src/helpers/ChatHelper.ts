import Cookies from "js-cookie";
import { ChatStateInterface, ChatUserInterface } from ".";

export class ChatHelper {

  static current: ChatStateInterface = { mainConversation: null, hostConversation: null, user: { firstName: "", lastName: "", isHost: false } };

  static getUser(): ChatUserInterface {
    let name = Cookies.get("displayName");
    if (!name) {
      name = `Anonymous${1000 + Math.floor(Math.random() * 9000)}`;
      Cookies.set("displayName", name);
    }
    const [firstName, ...rest] = name.split(" ");
    const user: ChatUserInterface = { firstName, lastName: rest.join(" "), isHost: false };
    ChatHelper.current.user = user;
    return user;
  }

  static insertLinks(text: string) {
    const escapeHtml = (str: string) => str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    const exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/ig;
    const escapedText = escapeHtml(text);
    return escapedText.replace(exp, (match) => {
      const safeUrl = encodeURI(decodeURI(match));
      return `<a href='${safeUrl}' target='_blank' rel='noopener noreferrer'>${match}</a>`;
    });
  }
}
