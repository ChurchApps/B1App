export * from "@/appBase/interfaces";

export interface ColumnInterface {
  size: number;
  elements: ElementInterface[];
}

export interface SectionChildInterface {
  elementType: string;
}

export interface ElementInterface extends SectionChildInterface {
  id?: string;
  churchId?: string;
  sectionId?: string;
  sort?: number;
  parentId?: string;
  size?: number;
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

  elements?: Element[];
}



export interface PageInterface {
  id?: string;
  churchId?: string;
  url?: string;
  title?: string;
  headerImage?: string;

  sections?: SectionInterface[];
}
