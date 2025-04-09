import { ConversationInterface, MessageInterface, SocketPayloadInterface, SermonInterface } from "@churchapps/apphelper/dist/helpers";
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
  stylesJSON?: string;
  styles?: { all?: any, desktop?: any, mobile?: any };
  animationsJSON?: string;
  animations?: { onShow: string, onShowSpeed: string };
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
  headingColor?: string;
  linkColor?: string;
  sort?: number;
  targetBlockId?: string;
  answersJSON?: string;
  answers?: any;
  stylesJSON?: string;
  styles?: any;
  animationsJSON?: string;
  animations?: any;

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

export interface StreamingButtonInterface { text: string, url: string }
export interface StreamingTabInterface { text: string, url: string, icon: string, type: string, data: string, updated?: boolean }
export interface StreamingServiceExtendedInterface { videoUrl: string, serviceTime: string, earlyStart: string, chatBefore: string, chatAfter: string, provider: string, providerKey: string, localCountdownTime?: Date, localStartTime?: Date, localEndTime?: Date, localChatStart?: Date, localChatEnd?: Date, label: string, id?: string, sermon?: SermonInterface }
export interface StreamConfigInterface { keyName?: string, churchId?: string, buttons?: StreamingButtonInterface[], tabs?: StreamingTabInterface[], services?: StreamingServiceExtendedInterface[], switchToConversationId: string, jitsiRoom: string }

export interface ChatPayloadInterface extends SocketPayloadInterface { churchId: string, conversationId: string }
export interface ChatViewerInterface { displayName: string, id: string, ipAddress?: string }
export interface ChatAttendanceInterface { viewers?: ChatViewerInterface[], totalViewers?: number, conversationId: string }
export interface ChatRoomInterface { conversation: ConversationInterface, attendance: ChatAttendanceInterface, messages: MessageInterface[], callout: MessageInterface, prayerRequests?: ConversationInterface[], joined: boolean, blockedIps?: string[] }
export interface ChatStateInterface { mainRoom: ChatRoomInterface, hostRoom: ChatRoomInterface, privateRooms: ChatRoomInterface[], chatEnabled: boolean, user: ChatUserInterface }
export interface ChatUserInterface { firstName: string, lastName: string, isHost: boolean, isBlocked?: boolean }
export interface ChatBlockedInterface { conversationId?: string, ipAddresses?: string[] }

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
  contentType?: string;
  contentId?: string;
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
  groupId: string;
  timeSent?: Date;
  timeUpdated?: Date;
  conversationId?: string;
  conversation?: ConversationInterface;
  data?: any;
}


export interface GlobalStyleInterface {
  id?: string,
  churchId?: string,
  fonts?: string,
  palette?: any,
  customCss?: string,
  customJS?: string
}

export interface InlineStylesInterface {
  all: any,
  desktop: any,
  mobile: any
}

export interface AnimationsInterface {
  onShow: string,
  onShowSpeed: string
}


export interface StyleOption {
  label: string,
  key: string,
  type: "color" | "px" | "select" | "text" | "text-shadow",
  default: string | number,
  options?: string[]
}

export const allStyleOptions: StyleOption[] = [
  { label: "Border Color", key: "border-color", type: "color", default: "#FF0000" },
  { label: "Border Radius", key: "border-radius", type: "px", default: "5" },
  { label: "Border Style", key: "border-style", type: "select", default: "solid", options: ["none", "solid", "dotted", "dashed", "double", "groove", "ridge", "inset", "outset"] },
  { label: "Border Width", key: "border-width", type: "px", default: "1" },
  { label: "Background Color", key: "background-color", type: "color", default: "#FF0000" },
  { label: "Color", key: "color", type: "color", default: "#FF0000" },
  { label: "Font Family", key: "font-family", type: "text", default: "Roboto" },
  { label: "Font Size", key: "font-size", type: "px", default: "14" },
  { label: "Font Style", key: "font-style", type: "select", default: "italic", options: ["normal", "italic"] },
  { label: "Height", key: "height", type: "px", default: 500 },
  { label: "Line Height", key: "line-height", type: "px", default: "14" },
  { label: "Margin", key: "margin", type: "px", default: 0 },
  { label: "Margin Left", key: "margin-left", type: "px", default: 0 },
  { label: "Margin Right", key: "margin-right", type: "px", default: 0 },
  { label: "Margin Top", key: "margin-top", type: "px", default: 0 },
  { label: "Margin Bottom", key: "margin-bottom", type: "px", default: 0 },
  { label: "Max Width", key: "max-width", type: "px", default: 500 },
  { label: "Max Height", key: "max-height", type: "px", default: 500 },
  { label: "Min Width", key: "min-width", type: "px", default: 500 },
  { label: "Min Height", key: "min-height", type: "px", default: 500 },
  { label: "Padding", key: "padding", type: "px", default: 0 },
  { label: "Padding Left", key: "padding-left", type: "px", default: 0 },
  { label: "Padding Right", key: "padding-right", type: "px", default: 0 },
  { label: "Padding Top", key: "padding-top", type: "px", default: 0 },
  { label: "Padding Bottom", key: "padding-bottom", type: "px", default: 0 },
  { label: "Text Shadow", key: "text-shadow", type: "text-shadow", default: "1px 1px 2px black;" },
  { label: "Width", key: "width", type: "px", default: 500 }
]


export interface PageLink {
  pageId?: string;
  title: string;
  url: string;
  custom: boolean;
  children?: PageLink[];
  expanded?: boolean;
}




/* Temp for songs.  Move to Helpers when stable */


export interface SongInterface {
  id?: string,
  name?: string,
  dateAdded: Date
}

export interface SongDetailInterface {
  id?: string,
  praiseChartsId?: string,
  title?: string,
  artist?: string,
  album?: string,
  language?: string,
  thumbnail?: string,
  releaseDate?: Date,
  bpm?: number,
  keySignature?: string,
  seconds: number,
  meter?: string,
  tones?: string,
}

export interface SongDetailLinkInterface {
  id?: string,
  songDetailId?: string,
  service?: string,
  serviceKey?: string,
  url?: string,
}

export interface ArrangementInterface {
  id?: string,
  songId?: string,
  songDetailId?: string,
  name?: string,
  lyrics?: string
}


export interface ArrangementKeyInterface {
  id?: string,
  arrangementId?: string,
  keySignature?: string,
  shortDescription?: string
}

export interface PlanItemInterface {
  id?: string,
  planId?: string,
  parentId?: string,
  sort?: number,
  itemType?: string,
  relatedId?: string,
  label?: string,
  description?: string,
  seconds?: number

  children?: PlanItemInterface[]
}
