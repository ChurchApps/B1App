import { ApiHelper, GroupInterface } from "@churchapps/apphelper";

interface PageLink {
  title: string;
  url: string;
  custom: boolean;
  children?: PageLink[];
}

export class PageHelper {

  static loadPageTree = async () => {
    const customPages = await ApiHelper.get("/pages", "ContentApi");
    const templatePages: PageLink[] = await PageHelper.getTemplatePages();
    let result: PageLink[] = [...templatePages];

    const groupPage = result.find((p) => p.url === "/groups");
    customPages.forEach((p: any) => {
      const page: PageLink = { title: p.title, url: p.url, custom: true };
      if (p.url.indexOf("/groups") === -1) {
        let existing = result.find((r) => r.url === p.url);
        if (existing) { existing.title = p.title; existing.custom = true; }
        else result.push(page);
      } else {
        let existing = groupPage.children.find((r) => r.url === p.url);
        if (existing) { existing.title = p.title; existing.custom = true; }
        else groupPage.children.push(page);
      }
    });
    return result;
  }

  static getTemplatePages = async () => {
    const templatePages: PageLink[] = [
      { title: "Bible", url: "/bible", custom: false },
      { title: "Donate", url: "/donate", custom: false },
      { title: "Sermons", url: "/sermons", custom: false },
      { title: "Stream", url: "/stream", custom: false },
      { title: "Verse of the Day", url: "/votd", custom: false }
    ]

    const groupPage: PageLink = { title: "Groups", url: "/groups", custom: false, children: [] };
    const groups: GroupInterface[] = await ApiHelper.get("/groups", "MembershipApi");

    const labels: string[] = [];
    groups.forEach((g: any) => {
      g.labelArray?.forEach((l: string) => {
        if (!labels.includes(l)) labels.push(l);
      });
    });

    labels.forEach((l: string) => {
      groupPage.children.push({ title: l, url: `/groups/${l.toLowerCase().replace(" ", "-")}`, custom: false });
    });


    groups.forEach((g: any) => {
      groupPage.children.push({ title: g.name, url: `/groups/details/${g.id}`, custom: false });
    });
    templatePages.push(groupPage);
    return templatePages;
  }


}
