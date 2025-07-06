"use client";

import { useContext, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import UserContext from "@/context/UserContext";
import { UrlHelper } from "@/helpers";

interface Props {
  children: React.ReactNode;
  sdSlug: string;
}

export function AuthGuard({ children, sdSlug }: Props) {
  const context = useContext(UserContext);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (context && !context.user) {
      // Encode the current URL as a return URL parameter, removing sdSlug to avoid double inclusion
      const returnUrl = encodeURIComponent(UrlHelper.getReturnUrl(pathname, sdSlug));
      router.push(`/login?returnUrl=${returnUrl}`);
    }
  }, [context, router, sdSlug, pathname]);

  if (!context?.user) {
    return null;
  }

  return <>{children}</>;
}
