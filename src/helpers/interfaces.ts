export * from "@/appBase/interfaces";
import { SermonInterface } from "@/appBase/interfaces/Content";
import { Permissions as BasePermissions } from "@/appBase/interfaces/Permissions"
import { ConversationInterface, MessageInterface, SocketPayloadInterface } from ".";
import { ConfigurationInterface } from "./ConfigHelper";

export interface ColumnInterface {
  size: number;
  elements: ElementInterface[];
}

export interface ElementInterface {
  id?: string;
  churchId?: string;
  sectionId?: string;
  blockId?: string;
  parentId?: string;
  size?: number;
  answersJSON?: string;
  answers?: any;
  sort?: number;
  elementType: string;
  elements?: ElementInterface[];
}

export interface SectionInterface {
  id?: string;
  churchId?: string;
  pageId?: string;
  blockId?: string;
  zone?: string;
  background?: string;
  textColor?: string;
  sort?: number;
  targetBlockId?: string;
  answersJSON?: string;
  answers?: any;

  sourceId?: string;
  sections?: SectionInterface[];
  elements?: ElementInterface[];
}

export interface PageInterface {
  id?: string;
  churchId?: string;
  url?: string;
  title?: string;
  layout?: string;

  sections?: SectionInterface[];
}

export interface BlockInterface {
  id?: string;
  churchId?: string;
  blockType?: string;
  name?: string;

  sections?: SectionInterface[];
}

export interface B1PageInterface {
  id?: string;
  churchId?: string;
  name?: string;
  lastModified?: Date;
  content?: string;
}

export interface B1LinkInterface {
  id?: string;
  churchId: string;
  category: string;
  url?: string;
  text: string;
  sort: number;
  linkType: string;
  linkData: string;
  icon: string;
  photo?: string;
}

export interface WrapperPageProps {
  config: ConfigurationInterface
}

export class Permissions extends BasePermissions {

}

export interface StreamingButtonInterface { text: string, url: string }
export interface StreamingTabInterface { text: string, url: string, icon: string, type: string, data: string, updated?: boolean }
export interface StreamingServiceExtendedInterface { videoUrl: string, serviceTime: string, earlyStart: string, chatBefore: string, chatAfter: string, provider: string, providerKey: string, localCountdownTime?: Date, localStartTime?: Date, localEndTime?: Date, localChatStart?: Date, localChatEnd?: Date, label: string, id?: string, sermon?: SermonInterface }
export interface StreamConfigInterface { keyName?: string, churchId?: string, buttons?: StreamingButtonInterface[], tabs?: StreamingTabInterface[], services?: StreamingServiceExtendedInterface[], switchToConversationId: string, jitsiRoom: string }

export interface ChatPayloadInterface extends SocketPayloadInterface { churchId: string, conversationId: string }
export interface ChatViewerInterface { displayName: string, id: string }
export interface ChatAttendanceInterface { viewers?: ChatViewerInterface[], totalViewers?: number, conversationId: string }
export interface ChatRoomInterface { conversation: ConversationInterface, attendance: ChatAttendanceInterface, messages: MessageInterface[], callout: MessageInterface, prayerRequests?: ConversationInterface[], joined: boolean }
export interface ChatStateInterface { mainRoom: ChatRoomInterface, hostRoom: ChatRoomInterface, privateRooms: ChatRoomInterface[], chatEnabled: boolean, user: ChatUserInterface }
export interface ChatUserInterface { firstName: string, lastName: string, isHost: boolean }

export interface ChatEventsInterface {
  messageHandler: (message: MessageInterface) => void,
  deleteHandler: (messageId: string) => void,
  calloutHandler: (message: MessageInterface) => void,
  attendanceHandler: (attendance: ChatAttendanceInterface) => void,
  prayerRequestHandler: (conversation: ConversationInterface) => void,
  privateMessageHandler: (conversation: ConversationInterface) => void,
  privateRoomAddedHandler: (conversation: ConversationInterface) => void,
  videoChatInviteHandler: (roomName: string) => void,
  disconnectHandler: () => void,
}

export interface FileInterface {
  id?: string;
  fileName?: string;
  contentPath?: string;
  fileType?: string;
  size?: number;
  dateModified?: Date;
  fileContents?: string;
}



export interface TimelinePostInterface {
  postType: string;
  postId: string;
  timeSent?: Date;
  timeUpdated?: Date;
  conversationId?: string;
  conversation?: ConversationInterface;
  data?: any;
}


