"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Banner } from "@churchapps/apphelper/dist/components/header/Banner";
import { UserHelper } from "@churchapps/apphelper/dist/helpers/UserHelper";
import { Permissions } from "@churchapps/helpers";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { ConfigHelper, ConfigurationInterface } from "@/helpers/ConfigHelper";
import { Tabs } from "@/components/admin/settings/Tabs";

type PageParams = {sdSlug:string }

export default function AdminPagesClient() {
  const [config, setConfig] = useState<ConfigurationInterface>(null);
  const params = useParams<PageParams>()

  const loadData = () => {
    ConfigHelper.load(params.sdSlug).then((data) => { setConfig(data); });
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AdminWrapper config={config}>
      <Banner><h1>Mobile App Settings</h1></Banner>
      <div id="mainContent">
        {UserHelper.checkAccess(Permissions.contentApi.content.edit)
          && <Tabs updatedFunction={ () => {ConfigHelper.clearCache("sdSlug=" + UserHelper.currentUserChurch.church.subDomain);} } />
        }
      </div>
    </AdminWrapper>
  );
}
