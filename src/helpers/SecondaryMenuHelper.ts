import { Locale, UserHelper, Permissions } from "@churchapps/apphelper";

interface MenuItem {
  url: string;
  label: string;
}

export class SecondaryMenuHelper {

  static getSecondaryMenu = (path:string) => {
    let result:{menuItems:MenuItem[], label:string} = {menuItems:[], label:""};

    if (path.startsWith("/people") || path.startsWith("/groups") || path.startsWith("/attendance")) result = this.getPeopleMenu(path);
    else if (path.startsWith("/admin")) result = this.getMobileMenu(path);
    else if (path===("/")) result = this.getDashboardMenu(path);
    return result;
  }

  static getPeopleMenu = (path:string) => {
    const menuItems:MenuItem[] = []
    let label:string = "";
    menuItems.push({url: "/groups", label: Locale.label("components.wrapper.groups")});
    menuItems.push({url: "/people", label: Locale.label("components.wrapper.ppl")});
    if (UserHelper.checkAccess(Permissions.attendanceApi.attendance.viewSummary)) menuItems.push({url:"/attendance", label: Locale.label("components.wrapper.att")});

    if (path.startsWith("/groups")) label = Locale.label("components.wrapper.groups");
    else if (path.startsWith("/people")) label = Locale.label("components.wrapper.ppl");
    else if (path.startsWith("/attendance")) label = Locale.label("components.wrapper.att");

    return {menuItems, label};
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


  static getDashboardMenu = (path:string) => {
    const menuItems:MenuItem[] = []
    let label:string = "";
    menuItems.push({url: "/", label: Locale.label("components.wrapper.dash") });

    if (path==="/") label = Locale.label("components.wrapper.dash");


    return {menuItems, label};
  }

}
