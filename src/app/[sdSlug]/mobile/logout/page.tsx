"use client";

import React, { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCookies } from "react-cookie";
import { ApiHelper } from "@churchapps/apphelper";
import UserContext from "@/context/UserContext";

export default function MobileLogout() {
  const router = useRouter();
  const context = useContext(UserContext);
  const [, , removeCookie] = useCookies(["jwt", "email", "name", "lastChurchId"]);

  useEffect(() => {
    removeCookie("jwt", { path: "/" });
    removeCookie("email", { path: "/" });
    removeCookie("name", { path: "/" });
    removeCookie("lastChurchId", { path: "/" });

    ApiHelper.clearPermissions();
    context?.setUser(null);
    context?.setPerson(null);
    context?.setUserChurches(null);
    context?.setUserChurch(null);

    const t = setTimeout(() => router.replace("/mobile"), 300);
    return () => clearTimeout(t);
  }, []);

  return null;
}
