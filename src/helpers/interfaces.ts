export * from "@/appBase/interfaces";

export interface ColumnInterface {
  size: number;
  components: ComponentInterface[];
}

export interface SectionChildInterface {
  componentType: string;
}

export interface ComponentInterface extends SectionChildInterface {
  answers: any;
}

export interface RowInterface extends SectionChildInterface {
  columns: ColumnInterface[];
}

export interface SectionInterface {
  background?: string;
  text?: string;
  components?: ComponentInterface[];
}



export interface PageInterface {
  id?: string;
  churchId?: string;
  url?: string;
  title?: string;
  headerImage?: string;

  sections?: SectionInterface[];
}
