export * from "@/appBase/interfaces";

export interface ColumnInterface {
  size: number;
  elements: ElementInterface[];
}

export interface SectionChildInterface {
  sort?: number;
  elementType: string;
}

export interface ElementInterface extends SectionChildInterface {
  id?: string;
  churchId?: string;
  sectionId?: string;
  parentId?: string;
  size?: number;
  answersJSON?: string;
  answers?: any;
}

export interface RowInterface extends SectionChildInterface {
  columns: ColumnInterface[];
}

export interface SectionInterface {
  id?: string;
  churchId?: string;
  pageId?: string;
  background?: string;
  textColor?: string;
  sort?: number;

  elements?: ElementInterface[];
}



export interface PageInterface {
  id?: string;
  churchId?: string;
  url?: string;
  title?: string;
  headerImage?: string;

  sections?: SectionInterface[];
}
