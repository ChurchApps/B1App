import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import type { GroupInterface } from "@churchapps/apphelper";
import { PageLink } from "./interfaces";

export class PageHelper {

  static sortLevel(items: PageLink[]) {
    return items.sort((a, b) => {
      if (a.url < b.url) return -1;
      if (a.url > b.url) return 1;
      return 0;
    });
  }

  static loadPageTree = async () => {
    const customPages = await ApiHelper.get("/pages", "ContentApi");
    const templatePages: PageLink[] = await PageHelper.getTemplatePages();
    let result: PageLink[] = [...templatePages];

    const groupPage = result.find((p) => p.url === "/groups");
    customPages.forEach((p: any) => {
      const page: PageLink = { pageId: p.id, title: p.title, url: p.url, custom: true };
      if (p.url.indexOf("/groups") === -1) {
        let existing = result.find((r) => r.url === p.url);
        if (existing) { existing.title = p.title; existing.custom = true; existing.pageId = p.id; }
        else result.push(page);
      } else {
        let existing = groupPage.children.find((r) => r.url === p.url);
        if (existing) { existing.title = p.title; existing.custom = true; existing.pageId = p.id; }
        else groupPage.children.push(page);
      }
    });
    groupPage.children = PageHelper.sortLevel(groupPage.children);
    result = PageHelper.sortLevel(result);
    return result;
  }

  static flatten = (tree: PageLink[]) => {
    let result: PageLink[] = [];
    tree.forEach((p) => {
      result.push(p);
      if (p.children) {
        result = result.concat(PageHelper.flatten(p.children));
        p.children = null;
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
      groupPage.children.push({ title: g.name, url: `/groups/details/${g.slug}`, custom: false });
    });
    templatePages.push(groupPage);
    return templatePages;
  }


}
