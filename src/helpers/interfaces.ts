export * from "@/appBase/interfaces";
import { Permissions as BasePermissions } from "@/appBase/interfaces/Permissions"

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

export class Permissions extends BasePermissions {
  static b1Api = {
    settings: {
      edit: { api: "B1Api", contentType: "Settings", action: "Edit" }
    }
  };
}
