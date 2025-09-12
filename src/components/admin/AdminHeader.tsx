"use client";

import React, { useEffect } from "react";

import { SiteHeader } from "@churchapps/apphelper";

import UserContext from "@/context/UserContext";
import { SecondaryMenuHelper } from "@/helpers/SecondaryMenuHelper";
import { useRouter, usePathname  } from "next/navigation";

export function AdminHeader() {
  const context = React.useContext(UserContext);
  const router = useRouter();
  const pathname = usePathname();
  const [primaryLabel, setPrimaryLabel] = React.useState<string>("Dashboard");

  useEffect(() => {
    getPrimaryLabel();
  }, [pathname]);

  // Handle church switching with subdomain redirect
  useEffect(() => {
    if (context?.userChurch?.church?.subDomain && typeof window !== 'undefined') {
      const currentSubdomain = window.location.hostname.split('.')[0];
      const newSubdomain = context.userChurch.church.subDomain;

      // Only redirect if the subdomain has actually changed
      if (currentSubdomain !== newSubdomain) {
        const protocol = window.location.protocol;
        const baseDomain = window.location.hostname.includes('localhost')
          ? 'localhost:3301'
          : window.location.hostname.split('.').slice(1).join('.');

        const newUrl = `${protocol}//${newSubdomain}.${baseDomain}${pathname}${window.location.search}`;

        // Redirect to the new subdomain
        window.location.href = newUrl;
      }
    }
  }, [context?.userChurch?.church?.subDomain, pathname]);

  const getPrimaryMenu = () => {
    const menuItems:{ url: string, icon:string, label: string }[] = []
    menuItems.push({url: "/", icon:"home", label: "Home" });
    menuItems.push({url: "/my", icon:"person", label: "Dashboard"});
    menuItems.push({url: "/admin", icon:"phone_android", label: "Mobile App"});
    menuItems.push({url: "/admin/site", icon:"web", label: "Website"});
    menuItems.push({url: "/admin/video", icon:"live_tv", label: "Sermons"});
    menuItems.push({url: "/admin/calendars", icon:"calendar_month", label: "Calendars"});
    //if (UserHelper.checkAccess(Permissions.givingApi.donations.viewSummary)) menuItems.push({ url:"/donations", label: Locale.label("components.wrapper.don"), icon: donationIcon });
    return menuItems;
  }

  const getPrimaryLabel = () => {
    const path = window.location.pathname;
    let result = "Dashboard";
    if (path.startsWith("/admin/site")) result = "Website";
    else if (path.startsWith("/admin/video")) result = "Sermons";
    else if (path.startsWith("/admin/calendars")) result = "Calendars";
    else if (path.startsWith("/admin")) result = "Mobile App";
    setPrimaryLabel(result);
    return result;
  }

  const secondaryMenu = SecondaryMenuHelper.getSecondaryMenu(window.location.pathname);

  const handleNavigate = (url: string) => {
    router.push(url);
  }

  /*<Typography variant="h6" noWrap>{UserHelper.currentUserChurch?.church?.name || ""}</Typography>*/
  return (<SiteHeader primaryMenuItems={getPrimaryMenu()} primaryMenuLabel={primaryLabel} secondaryMenuItems={secondaryMenu.menuItems} secondaryMenuLabel={secondaryMenu.label} context={context} appName={"B1"} onNavigate={handleNavigate} data-testid="admin-site-header" /> );
}
