"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Box } from "@mui/material";
import { UserHelper } from "@churchapps/apphelper/dist/helpers/UserHelper";
import { Permissions } from "@churchapps/helpers";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { ConfigHelper, ConfigurationInterface } from "@/helpers/ConfigHelper";
import { Tabs } from "@/components/admin/settings/Tabs";
import { PageHeader } from "@/components/ui";
import { PhoneIphone as PhoneIcon } from "@mui/icons-material";

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
      <PageHeader
        icon={<PhoneIcon />}
        title="Mobile App Settings"
        subtitle="Configure navigation tabs and settings for your church mobile app"
      />
      <Box sx={{ p: 3 }}>
        {UserHelper.checkAccess(Permissions.contentApi.content.edit) && (
          <Tabs updatedFunction={() => {
            ConfigHelper.clearCache("sdSlug=" + UserHelper.currentUserChurch.church.subDomain);
          }} />
        )}
      </Box>
    </AdminWrapper>
  );
}
