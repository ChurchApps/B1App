"use client";

import { useEffect } from "react";
import { redirect } from "next/navigation";
import { ApiHelper, Banner } from "@churchapps/apphelper";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { B1Settings } from "@/components";
import { WrapperPageProps } from "@/helpers";

export function AdminClientWrapper(props: WrapperPageProps) {
  const { isAuthenticated } = ApiHelper;


  useEffect(() => {
    if (!isAuthenticated) {
      redirect("/login");
    }
  }, [isAuthenticated]);

  return (
    <AdminWrapper config={props.config}>
      <Banner><h1>Mobile App Settings</h1></Banner>
      <div id="mainContent">
        <B1Settings />
      </div>
    </AdminWrapper>
  );
}
