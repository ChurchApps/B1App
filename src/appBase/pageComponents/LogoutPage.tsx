import React from "react";
import { useCookies } from "react-cookie"
import { ApiHelper } from "../helpers";
import { UserContextInterface } from "../interfaces";

interface Props { context?: UserContextInterface, }

export const LogoutPage: React.FC<Props> = (props) => {
  const [, , removeCookie] = useCookies(["jwt", "email", "name"]);

  removeCookie("jwt");
  removeCookie("email");
  removeCookie("name");

  ApiHelper.clearPermissions();
  props.context?.setUser(null);
  props.context?.setPerson(null);
  props.context?.setChurches(null);
  props.context?.setChurch(null);

  setTimeout(() => {
    // a must check for Nextjs
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }, 300);
  return null;
}
