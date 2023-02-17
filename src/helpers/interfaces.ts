export * from "@/appBase/interfaces";
import { SermonInterface } from "@/appBase/interfaces/Content";
import { Permissions as BasePermissions } from "@/appBase/interfaces/Permissions"
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
  static b1Api = {
    settings: {
      edit: { api: "B1Api", contentType: "Settings", action: "Edit" }
    }
  };
}

export interface StreamingButtonInterface { text: string, url: string }
export interface StreamingTabInterface { text: string, url: string, icon: string, type: string, data: string, updated?: boolean }
export interface StreamingServiceExtendedInterface { videoUrl: string, serviceTime: string, earlyStart: string, chatBefore: string, chatAfter: string, provider: string, providerKey: string, localCountdownTime?: Date, localStartTime?: Date, localEndTime?: Date, localChatStart?: Date, localChatEnd?: Date, label: string, id?: string, sermon?: SermonInterface }
export interface StreamConfigInterface { keyName?: string, churchId?: string, buttons?: StreamingButtonInterface[], tabs?: StreamingTabInterface[], services?: StreamingServiceExtendedInterface[], switchToConversationId: string, jitsiRoom: string }
