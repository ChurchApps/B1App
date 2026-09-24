"use client";

import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCookies } from "react-cookie";
import { useQueryClient } from "@tanstack/react-query";
import { ApiHelper, UserHelper } from "@churchapps/apphelper";
import UserContext from "@/context/UserContext";
import { clearAppBadge, PersonHelper } from "@/helpers";
import { clearMobileQueryCache } from "../MobileQueryProvider";

export default function MobileLogout(): null {
  const router = useRouter();
  const context = useContext(UserContext);
  const queryClient = useQueryClient();
  const [, , removeCookie] = useCookies(["jwt", "email", "name", "lastChurchId"]);

  useEffect(() => {
    void clearAppBadge();
    removeCookie("jwt", { path: "/" });
    removeCookie("email", { path: "/" });
    removeCookie("name", { path: "/" });
    removeCookie("lastChurchId", { path: "/" });

    ApiHelper.clearPermissions();
    UserHelper.user = null!;
    UserHelper.userChurches = [];
    UserHelper.currentUserChurch = null!;
    UserHelper.person = null!;
    PersonHelper.person = null!;
    void clearMobileQueryCache(queryClient).catch(() => {});
    context?.setUser(null!);
    context?.setPerson(null!);
    context?.setUserChurches(null!);
    context?.setUserChurch(null!);

    const t = setTimeout(() => router.replace("/mobile"), 300);
    return () => clearTimeout(t);
  }, []);

  return null;
}
