"use client";

import { useContext, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import UserContext from "@/context/UserContext";

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
      // Encode the current URL as a return URL parameter
      const returnUrl = encodeURIComponent(pathname);
      router.push(`/login?returnUrl=${returnUrl}`);
    }
  }, [context, router, sdSlug, pathname]);

  if (!context?.user) {
    return null;
  }

  return <>{children}</>;
}