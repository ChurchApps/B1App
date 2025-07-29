"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Box, Button } from "@mui/material";
import { UserHelper } from "@churchapps/apphelper";
import { Permissions } from "@churchapps/helpers";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { ConfigHelper, ConfigurationInterface } from "@/helpers/ConfigHelper";
import { B1LinkInterface } from "@/helpers";
import { Tabs } from "@/components/admin/settings/Tabs";
import { TabEdit } from "@/components/admin/settings/TabEdit";
import { PageHeader } from "@/components/ui";
import { PhoneIphone as PhoneIcon, Add as AddIcon } from "@mui/icons-material";

type PageParams = {sdSlug:string }

export default function AdminPagesClient() {
  const [config, setConfig] = useState<ConfigurationInterface>(null);
  const [editTab, setEditTab] = useState<B1LinkInterface>(null);
  const [refreshTabsKey, setRefreshTabsKey] = useState(0);
  const params = useParams<PageParams>()

  const loadData = () => {
    ConfigHelper.load(params.sdSlug).then((data) => { setConfig(data); });
  };

  const handleAddTab = () => {
    const newTab: B1LinkInterface = {
      churchId: UserHelper.currentUserChurch.church.id,
      sort: 0, // Will be set properly when saved
      text: "",
      url: "",
      icon: "home",
      linkData: "",
      linkType: "url",
      category: "b1Tab"
    };
    setEditTab(newTab);
  };

  const handleTabsUpdated = () => {
    setEditTab(null);
    setRefreshTabsKey(Math.random());
    ConfigHelper.clearCache("sdSlug=" + UserHelper.currentUserChurch.church.subDomain);
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
      >
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddTab}
          sx={{
            color: '#FFF',
            borderColor: 'rgba(255,255,255,0.5)',
            '&:hover': {
              borderColor: '#FFF',
              backgroundColor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          Add Tab
        </Button>
      </PageHeader>
      <Box sx={{ p: 3 }}>
        {editTab && (
          <Box sx={{ mb: 3 }}>
            <TabEdit
              currentTab={editTab}
              updatedFunction={handleTabsUpdated}
            />
          </Box>
        )}

        {UserHelper.checkAccess(Permissions.contentApi.content.edit) && (
          <Tabs
            onSelected={(tab: B1LinkInterface) => { setEditTab(tab); }}
            refreshKey={refreshTabsKey}
          />
        )}
      </Box>
    </AdminWrapper>
  );
}
