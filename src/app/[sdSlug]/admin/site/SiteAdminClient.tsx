"use client";

import { useEffect } from "react";
import { redirect } from "next/navigation";
import { EnvironmentHelper, WrapperPageProps } from "@/helpers";
import { ApiHelper, Banner, DisplayBox, ErrorMessages } from "@churchapps/apphelper";
import { useWindowWidth } from "@react-hook/window-size";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { SiteAdminWrapper } from "@/components/admin/SiteAdminWrapper";

export function SiteAdminClient(props: WrapperPageProps) {
  const { isAuthenticated } = ApiHelper;
  const windowWidth = useWindowWidth();

  EnvironmentHelper.initLocale();


  useEffect(() => {
    if (!isAuthenticated) redirect("/login");
  }, [isAuthenticated]);


  if (windowWidth < 882) {
    return <ErrorMessages errors={["Page editor is only available in desktop mode"]} />;
  }

  return (
    <>
      <AdminWrapper config={props.config}>
        <Banner><h1>Website</h1></Banner>
        <SiteAdminWrapper config={props.config}>
          <div id="mainContent">
            <DisplayBox headerText="Pages" headerIcon="article">
              <p>Use the left navigation to edit pages and links.</p>
            </DisplayBox>
          </div>
        </SiteAdminWrapper>
      </AdminWrapper>
    </>
  );
}
