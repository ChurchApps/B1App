import moment from "moment";
import { ApiHelper } from "@churchapps/apphelper";
import { UserHelper } from "@churchapps/apphelper";
import type { LinkInterface, StreamingServiceInterface } from "@churchapps/helpers";
import { BlockInterface, ElementInterface, PageInterface, SectionInterface } from "./interfaces";

export class TemplateHelper {
  static targetBlockId: string;
  static demoText: string
    = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Eget est lorem ipsum dolor."
    + " At lectus urna duis convallis convallis tellus id interdum velit. Amet cursus sit amet dictum. Tortor vitae purus faucibus ornare suspendisse sed nisi lacus sed."
    + " Risus sed vulputate odio ut. Interdum velit laoreet id donec. Ipsum nunc aliquet bibendum enim facilisis gravida neque convallis a. Proin sagittis nisl rhoncus mattis rhoncus."
    + " Nunc sed augue lacus viverra vitae congue eu consequat. Ultricies lacus sed turpis tincidunt id aliquet risus feugiat in.`";

  static links: LinkInterface[] = [
    { text: "Home", url: "/", linkType: "url", linkData: "", category: "website", icon: "" },
    { text: "Visit", url: "/visit", linkType: "url", linkData: "", category: "website", icon: "" },
    { text: "Sermons", url: "/sermons", linkType: "url", linkData: "", category: "website", icon: "" },
    { text: "About Us", url: "/about", linkType: "url", linkData: "", category: "website", icon: "" },
    { text: "Donate", url: "/donate", linkType: "url", linkData: "", category: "website", icon: "" }
  ];

  static footer = {
    block: { blockType: "sectionBlock", name: "Footer" },
    section: { background: "var(--lightAccent)", blockId: "", headingColor: "var(--dark)", linkColor: "var(--darkAccent)", sort: 0, textColor: "var(--dark)", zone: "block" },
    row: { answersJSON: '{"columns":"4,4,4"}', blockId: "", elementType: "row", sectionId: "", sort: 0 },
    logoElement: { blockId: "", elementType: "logo", parentId: "", sectionId: "", sort: 1 },
    addressElement: { blockId: "", elementType: "text", parentId: "", sectionId: "", sort: 1, answersJSON: "", answers: { text: "", textAlignment: "center" } },
    serviceTimesElement: { blockId: "", elementType: "text", parentId: "", sectionId: "", sort: 1, answersJSON: "", answers: { text: "", textAlignment: "center" } }
  };

  static donate = {
    page: { layout: "headerFooter", title: "Donate", url: "/donate" },
    section: { background: "var(--light)", headingColor: "var(--dark)", linkColor: "var(--darkAccent)", pageId: "", sort: 0, textColor: "var(--dark)", zone: "main" },
    heading: { elementType: "text", sectionId: "", sort: 1, answersJSON: '{"textAlignment":"center","text":"## DONATE"}', answers: { text: "## DONATE", textAlignment: "center" } },
    form: { elementType: "donation", sectionId: "", sort: 2 }
  };

  static aboutUs = {
    page: { layout: "headerFooter", title: "About Us", url: "/about" },
    section: { background: "var(--light)", headingColor: "var(--dark)", linkColor: "var(--darkAccent)", pageId: "", sort: 0, textColor: "var(--dark)", zone: "main" },
    heading: { elementType: "text", sectionId: "", sort: 1, answersJSON: '{"textAlignment":"center","text":"## ABOUT US"}', answers: { text: "## ABOUT US", textAlignment: "center" } },
    text1: { elementType: "text", sectionId: "", sort: 2, answersJSON: `{\"textAlignment\":\"center\",\"text\":\"${TemplateHelper.demoText}\"}`, answers: { text: TemplateHelper.demoText, textAlignment: "center" } },
    text2: { elementType: "text", sectionId: "", sort: 3, answersJSON: `{\"textAlignment\":\"center\",\"text\":\"${TemplateHelper.demoText}\"}`, answers: { text: TemplateHelper.demoText, textAlignment: "center" } },
    text3: { elementType: "text", sectionId: "", sort: 4, answersJSON: `{\"textAlignment\":\"center\",\"text\":\"${TemplateHelper.demoText}\"}`, answers: { text: TemplateHelper.demoText, textAlignment: "center" } }
  };

  static visit = {
    page: { layout: "headerFooter", title: "Visit", url: "/visit" },
    section: { background: "var(--light)", headingColor: "var(--dark)", linkColor: "var(--darkAccent)", pageId: "", sort: 0, textColor: "var(--dark)", zone: "main" },
    heading: { elementType: "text", sectionId: "", sort: 1, answersJSON: '{"textAlignment":"center","text":"## PLAN YOUR VISIT"}', answers: { text: "## PLAN YOUR VISIT", textAlignment: "center" } },
    heading2: {
      elementType: "text",
      sectionId: "",
      sort: 2,
      answersJSON: '{"textAlignment":"center","text":"**We Would Love to Hear from You!**"}',
      answers: { text: "**We Would Love to Hear from You!**", textAlignment: "center" }
    },
    text1: { elementType: "text", sectionId: "", sort: 3, answersJSON: `{\"textAlignment\":\"center\",\"text\":\"${TemplateHelper.demoText}\"}`, answers: { text: TemplateHelper.demoText, textAlignment: "center" } },
    map: { elementType: "map", sectionId: "", sort: 4, answersJSON: "" }
  };

  static sermons = {
    page: { layout: "headerFooter", title: "Sermons", url: "/sermons" },
    section: { background: "var(--light)", headingColor: "var(--dark)", linkColor: "var(--darkAccent)", pageId: "", sort: 0, textColor: "var(--dark)", zone: "main" },
    liveStream: { elementType: "stream", sectionId: "", sort: 1, answersJSON: '{"offlineContent":"hide"}' },
    heading: { elementType: "text", sectionId: "", sort: 2, answersJSON: '{"textAlignment":"center","text":"## SERMONS"}', answers: { text: "## SERMONS", textAlignment: "center" } },
    sermons: { elementType: "sermons", sectionId: "", sort: 3 }
  };

  static home = {
    page: { layout: "headerFooter", title: "Home", url: "/" },
    heroSection: { background: "https://content.churchapps.org/stockPhotos/4/bible.png", headingColor: "var(--light)", linkColor: "var(--light)", pageId: "", sort: 1, textColor: "var(--light)", zone: "main" },
    heroHeading: { elementType: "text", sectionId: "", sort: 1, answersJSON: "", answers: { text: "", textAlignment: "center" } },
    aboutSection: { background: "var(--light)", headingColor: "var(--dark)", linkColor: "var(--darkAccent)", pageId: "", sort: 2, textColor: "var(--dark)", zone: "main" },
    aboutHeading: { elementType: "text", sectionId: "", sort: 1, answersJSON: `{\"textAlignment\":\"center\",\"text\":\"#### About Us\"}`, answers: { text: "#### About Us", textAlignment: "center" } },
    aboutText: { elementType: "text", sectionId: "", sort: 2, answersJSON: `{\"textAlignment\":\"center\",\"text\":\"${TemplateHelper.demoText}\"}`, answers: { text: TemplateHelper.demoText, textAlignment: "center" } },
    aboutText2: { elementType: "text", sectionId: "", sort: 3, answersJSON: `{\"textAlignment\":\"center\",\"text\":\"${TemplateHelper.demoText}\"}`, answers: { text: TemplateHelper.demoText, textAlignment: "center" } }
  };

  static async createDefaultLinks() {
    const linksLength = await ApiHelper.get("/links?category=website", "ContentApi").then((data: LinkInterface[]) => data.length);
    const linksArr: LinkInterface[] = [];
    this.links.forEach((l, index) => {
      l.sort = linksLength + index;
      l.churchId = UserHelper.currentUserChurch.church.id;
      linksArr.push(l);
    });
    await ApiHelper.post("/links", linksArr, "ContentApi");
  }

  static async createDefaultFooter() {
    const currentChurch = UserHelper.currentUserChurch.church;
    const streamingServices = await ApiHelper.get("/streamingServices", "ContentApi");
    const serviceTimes: string[] = [];
    if (streamingServices.length > 0) {
      for (let i = 0; i < (streamingServices.length >= 2 ? 2 : 1); i++) {
        const service: StreamingServiceInterface = streamingServices?.[i];
        const text = `\\n\\n${service.label}\\n\\n*${moment.utc(service.serviceTime).format("LLL")}*`;
        serviceTimes.push(text);
      }
    }
    const b: BlockInterface[] = await ApiHelper.post("/blocks", [this.footer.block], "ContentApi");
    if (!b || b.length === 0) {
      throw new Error("Failed to create footer block");
    }
    const block = b[0];
    //need blockId to add the footer to the pages
    this.targetBlockId = block.id;
    const s: SectionInterface[] = await ApiHelper.post("/sections", [{ ...this.footer.section, blockId: block.id }], "ContentApi");
    if (!s || s.length === 0) {
      throw new Error("Failed to create footer section");
    }
    const section = s[0];
    const r: ElementInterface[] = await ApiHelper.post("/elements", [{ ...this.footer.row, blockId: block.id, sectionId: section.id }], "ContentApi");
    if (!r || r.length === 0) {
      throw new Error("Failed to create footer row");
    }
    const row = r[0];
    await ApiHelper.post(
      "/elements",
      [
        { ...this.footer.logoElement, blockId: block.id, parentId: row.elements[0].id, sectionId: section.id },
        {
          ...this.footer.addressElement,
          blockId: block.id,
          parentId: row.elements[1].id,
          sectionId: section.id,
          answersJSON:
            `{\"text\":\"#### **${currentChurch.name}**\\n\\n${currentChurch?.address1}${ currentChurch?.address2 ? `\\n\\n${currentChurch.address2}` : "" }\\n\\n${currentChurch?.city}, ${currentChurch?.state} ${currentChurch?.zip}\\n\\n${currentChurch?.country}\\n\\n\",
            \"textAlignment\":\"center\"}`,
          answers: {
            textAlignment: "center",
            text:
              `#### **${currentChurch.name}**\n\n${currentChurch?.address1}${ currentChurch?.address2 ? `\n\n${currentChurch.address2}` : "" }\n\n${currentChurch?.city}, ${currentChurch?.state} ${currentChurch?.zip}\n\n${currentChurch?.country}\n\n`
          }
        },
        {
          ...this.footer.serviceTimesElement,
          blockId: block.id,
          parentId: row.elements[2].id,
          sectionId: section.id,
          answersJSON: `{\"text\":\"#### **Services**${ serviceTimes.length > 0 ? `${serviceTimes.join("")}` : "\\n\\nNo Services available" }\\n\\n\",\"textAlignment\":\"center\"}`,
          answers: { textAlignment: "center", text: `#### **Services**${ serviceTimes.length > 0 ? `${serviceTimes.join("")}` : "\\n\\nNo Services available" }` }
        }
      ],
      "ContentApi"
    );
  }

  static async createHomePage() {
    const currentChurch = UserHelper.currentUserChurch.church;
    const p: PageInterface[] = await ApiHelper.post("/pages", [this.home.page], "ContentApi");
    if (!p || p.length === 0) {
      throw new Error("Failed to create home page");
    }
    const page = p[0];
    const s1: SectionInterface[] = await ApiHelper.post("/sections", [{ ...this.home.heroSection, pageId: page.id }], "ContentApi");
    const s2: SectionInterface[] = await ApiHelper.post("/sections", [{ ...this.home.aboutSection, pageId: page.id }], "ContentApi");
    if (!s1 || s1.length === 0 || !s2 || s2.length === 0) {
      throw new Error("Failed to create home page sections");
    }
    const section1 = s1[0];
    const section2 = s2[0];
    await ApiHelper.post(
      "/elements",
      [
        {
          ...this.home.heroHeading,
          sectionId: section1.id,
          answersJSON: `{\"textAlignment\":\"center\",\"text\":\"# Welcome to ${currentChurch.name}\"}`,
          answers: { textAlignment: "center", text: `# Welcome to ${currentChurch.name}` }
        },
        { ...this.home.aboutHeading, sectionId: section2.id },
        { ...this.home.aboutText, sectionId: section2.id },
        { ...this.home.aboutText2, sectionId: section2.id }
      ],
      "ContentApi"
    );
  }

  static async createVisitPage(pageId?: string) {
    let PAGE_ID;
    if (!pageId) {
      const p: PageInterface[] = await ApiHelper.post("/pages", [this.visit.page], "ContentApi");
      if (!p || p.length === 0) {
        throw new Error("Failed to create visit page");
      }
      const page = p[0];
      PAGE_ID = page.id;
    } else {
      PAGE_ID = pageId;
    }

    const currentChurch = UserHelper.currentUserChurch.church;
    const s: SectionInterface[] = await ApiHelper.post("/sections", [{ ...this.visit.section, pageId: PAGE_ID }], "ContentApi");
    if (!s || s.length === 0) {
      throw new Error("Failed to create visit page section");
    }
    const section = s[0];
    await ApiHelper.post(
      "/elements",
      [
        { ...this.visit.heading, sectionId: section.id },
        { ...this.visit.heading2, sectionId: section.id },
        { ...this.visit.text1, sectionId: section.id },
        {
          ...this.visit.map,
          sectionId: section.id,
          answersJSON: `{\"mapAddress\":\"${currentChurch.address1}, ${currentChurch.city}, ${currentChurch.state}, ${currentChurch.country}\",\"mapLabel\":\"${currentChurch.name}\"}`
        }
      ],
      "ContentApi"
    );
  }

  static async createSermonsPage(pageId?: string) {
    let PAGE_ID;
    if (!pageId) {
      const p: PageInterface[] = await ApiHelper.post("/pages", [this.sermons.page], "ContentApi");
      if (!p || p.length === 0) {
        throw new Error("Failed to create sermons page");
      }
      const page = p[0];
      PAGE_ID = page.id;
    } else {
      PAGE_ID = pageId;
    }

    const s: SectionInterface[] = await ApiHelper.post("/sections", [{ ...this.sermons.section, pageId: PAGE_ID }], "ContentApi");
    if (!s || s.length === 0) {
      throw new Error("Failed to create sermons page section");
    }
    const section = s[0];
    await ApiHelper.post("/elements", [{ ...this.sermons.liveStream, sectionId: section.id }, { ...this.sermons.heading, sectionId: section.id }, { ...this.sermons.sermons, sectionId: section.id }], "ContentApi");
  }

  static async createAboutUsPage(pageId?: string) {
    let PAGE_ID;
    if (!pageId) {
      const p: PageInterface[] = await ApiHelper.post("/pages", [this.aboutUs.page], "ContentApi");
      if (!p || p.length === 0) {
        throw new Error("Failed to create about us page");
      }
      const page = p[0];
      PAGE_ID = page.id;
    } else {
      PAGE_ID = pageId;
    }

    const s: SectionInterface[] = await ApiHelper.post("/sections", [{ ...this.aboutUs.section, pageId: PAGE_ID }], "ContentApi");
    if (!s || s.length === 0) {
      throw new Error("Failed to create about us page section");
    }
    const section = s[0];
    await ApiHelper.post("/elements", [{ ...this.aboutUs.heading, sectionId: section.id }, { ...this.aboutUs.text1, sectionId: section.id }, { ...this.aboutUs.text2, sectionId: section.id }, { ...this.aboutUs.text3, sectionId: section.id }], "ContentApi");
  }

  static async createDonatePage(pageId?: string) {
    let PAGE_ID;
    if (!pageId) {
      const p: PageInterface[] = await ApiHelper.post("/pages", [this.donate.page], "ContentApi");
      if (!p || p.length === 0) {
        throw new Error("Failed to create donate page");
      }
      const page = p[0];
      PAGE_ID = page.id;
    } else {
      PAGE_ID = pageId;
    }

    const s: SectionInterface[] = await ApiHelper.post("/sections", [{ ...this.donate.section, pageId: PAGE_ID }], "ContentApi");
    if (!s || s.length === 0) {
      throw new Error("Failed to create donate page section");
    }
    const section = s[0];
    await ApiHelper.post("/elements", [{ ...this.donate.heading, sectionId: section.id }, { ...this.donate.form, sectionId: section.id }], "ContentApi");
  }

  static async createAIPage(title: string, description: string, url: string) {
    // Call the AskApi to create the page with AI-generated content
    const aiPageData = {
      title: title,
      description: description,
      url: url
    };

    // First, get the AI-generated page content
    const aiResponse = await ApiHelper.post("/website/createPage", aiPageData, "AskApi");

    // Then create the actual page with the AI-generated content
    const pageData = await ApiHelper.post("/pages/temp/ai", aiResponse, "ContentApi");

    return pageData;
  }

  static async createDefaultPages() {
    const promises = [];
    promises.push(this.createHomePage());
    promises.push(this.createVisitPage());
    promises.push(this.createSermonsPage());
    promises.push(this.createAboutUsPage());
    promises.push(this.createDonatePage());
    await Promise.all(promises);
  }
}
