import { Locale } from "@churchapps/apphelper/dist/helpers/Locale";

interface MenuItem {
  url: string;
  label: string;
}

export class SecondaryMenuHelper {

  static getSecondaryMenu = (path:string) => {
    let result:{menuItems:MenuItem[], label:string} = {menuItems:[], label:""};

    if (path.startsWith("/admin/site")) result = this.getWebMenu(path);
    if (path.startsWith("/admin/video")) result = this.getSermonsMenu(path);
    if (path.startsWith("/admin/calendars")) result = this.getCalendarsMenu(path);
    else if (path==="/admin" || path==="/admin/pages") result = this.getMobileMenu(path);
    else if (path===("/")) result = this.getDashboardMenu(path);
    return result;
  }

  static getMobileMenu = (path:string) => {
    const menuItems:MenuItem[] = []
    let label:string = "";
    menuItems.push({url: "/admin", label: "Navigation" });
    menuItems.push({url: "/admin/pages", label: "Pages" });

    if (path.startsWith("/admin/pages")) label = "Pages";
    else if (path.startsWith("/admin")) label = "Navigation";

    return {menuItems, label};
  }

  static getWebMenu = (path:string) => {
    const menuItems:MenuItem[] = []
    let label:string = "";
    menuItems.push({url: "/admin/site", label: "Pages" });
    menuItems.push({url: "/admin/site/blocks", label: "Blocks" });
    menuItems.push({url: "/admin/site/styles", label: "Appearance" });
    menuItems.push({url: "/admin/site/files", label: "Files" });

    if (path.startsWith("/admin/site/blocks")) label = "Blocks";
    else if (path.startsWith("/admin/site/styles")) label = "Appearance";
    else if (path.startsWith("/admin/site/files")) label = "Files";
    else if (path.startsWith("/admin/site")) label = "Pages";

    return {menuItems, label};
  }

  static getSermonsMenu = (path:string) => {
    const menuItems:MenuItem[] = []
    let label:string = "";
    menuItems.push({url: "/admin/video", label: "Sermons" });
    menuItems.push({url: "/admin/video/playlists", label: "Playlists" });
    menuItems.push({url: "/admin/video/settings", label: "Times" });
    menuItems.push({url: "/admin/video/bulk", label: "Bulk Import" });

    if (path.startsWith("/admin/video/bulk")) label = "Bulk Import";
    else if (path.startsWith("/admin/video/settings")) label = "Times";
    else if (path.startsWith("/admin/video/playlists")) label = "Playlists";
    else if (path.startsWith("/admin/video")) label = "Sermons";

    return {menuItems, label};
  }

  static getCalendarsMenu = (path:string) => {
    const menuItems:MenuItem[] = []
    let label:string = "";
    menuItems.push({url: "/admin/calendars", label: "Curated Calendars" });

    if (path.startsWith("/admin/calendars")) label = "Curated Calendars";

    return {menuItems, label};
  }


  static getDashboardMenu = (path:string) => {
    const menuItems:MenuItem[] = []
    let label:string = "";
    menuItems.push({url: "/", label: Locale.label("components.wrapper.dash") });

    if (path==="/") label = Locale.label("components.wrapper.dash");


    return {menuItems, label};
  }

}
