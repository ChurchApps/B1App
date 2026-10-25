import type { ConversationInterface, SermonInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "./ConfigHelper";

export interface ElementInterface {
  id?: string;
  churchId?: string;
  sectionId?: string;
  blockId?: string;
  parentId?: string;
  size?: number;
  answersJSON?: string;
  answers?: Record<string, string | number | boolean>;
  stylesJSON?: string;
  styles?: { all?: Record<string, string>, desktop?: Record<string, string>, mobile?: Record<string, string> };
  animationsJSON?: string;
  animations?: { onShow?: string, onShowSpeed?: string };
  sort?: number;
  elementType?: string;
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
  answers?: Record<string, string | number | boolean>;
  stylesJSON?: string;
  styles?: { all?: Record<string, string>, desktop?: Record<string, string>, mobile?: Record<string, string> };
  animationsJSON?: string;
  animations?: { onShow?: string, onShowSpeed?: string };

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
  metaDescription?: string;

  sections?: SectionInterface[];
}

export interface PostInterface {
  id?: string;
  churchId?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  authorId?: string;
  authorName?: string;
  photoUrl?: string;
  publishDate?: string;
  category?: string;
  tags?: string;
}

export interface WrapperPageProps {
  config: ConfigurationInterface
}

export interface StreamingButtonInterface { text: string, url: string }
export interface StreamingTabInterface { text: string, url: string, icon: string, type: string, data: string, updated?: boolean }
export interface StreamingServiceExtendedInterface { videoUrl: string, serviceTime: string, earlyStart: string, chatBefore: string, chatAfter: string, provider: string, providerKey: string, localCountdownTime?: Date, localStartTime?: Date, localEndTime?: Date, localChatStart?: Date, localChatEnd?: Date, label: string, id?: string, sermon?: SermonInterface }
export interface StreamConfigInterface { keyName?: string, churchId?: string, buttons?: StreamingButtonInterface[], tabs?: StreamingTabInterface[], services?: StreamingServiceExtendedInterface[] }

export interface ChatStateInterface { mainConversation: ConversationInterface | null, hostConversation: ConversationInterface | null, user: ChatUserInterface }
export interface ChatUserInterface { firstName: string, lastName: string, isHost: boolean }

export type { FileInterface } from "@churchapps/helpers";

export interface GlobalStyleInterface {
  id?: string,
  churchId?: string,
  fonts?: string,
  palette?: string,
  navStyles?: string,
  customCss?: string,
  customJS?: string
}

export interface PageLink {
  pageId?: string;
  title: string;
  url: string;
  custom: boolean;
  children?: PageLink[];
  expanded?: boolean;
}

/* Temp for songs.  Move to Helpers when stable */

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
  seconds?: number,
  link?: string,
  providerId?: string,
  providerPath?: string,
  providerContentPath?: string,
  thumbnailUrl?: string,
  positionId?: string,

  children?: PlanItemInterface[]
}

export interface ExternalVenueRefInterface {
  externalProviderId: string;
  programId: string;
  studyId: string;
  lessonId: string;
  venueId: string;
}

// Mirrors @churchapps/helpers — switch to the package exports once >1.7.1 is published.
export interface CampaignInterface {
  id?: string;
  name?: string;
  description?: string;
  goalAmount?: number;
  startDate?: string;
  endDate?: string;
  allowSelfPledge?: boolean;
}

export interface PledgeInterface {
  id?: string;
  churchId?: string;
  campaignId?: string;
  personId?: string;
  amount?: number;
}

export type PledgeStatus = "notStarted" | "inProgress" | "fulfilled" | "beyondPledged" | "nonPledged";

export interface CampaignProgressInterface {
  campaign?: CampaignInterface;
  totalPledged?: number;
  totalGiven?: number;
}

export interface MyPledgeInterface {
  pledge?: PledgeInterface;
  givenAmount?: number;
  status?: PledgeStatus;
}
