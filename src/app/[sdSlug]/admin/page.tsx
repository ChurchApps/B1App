"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Box, Button } from "@mui/material";
import { UserHelper } from "@churchapps/apphelper/dist/helpers/UserHelper";
import { Permissions } from "@churchapps/helpers";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { ConfigHelper, ConfigurationInterface } from "@/helpers/ConfigHelper";
import { Tabs } from "@/components/admin/settings/Tabs";
import { PageHeader } from "@/components/ui";
import { PhoneIphone as PhoneIcon, Add as AddIcon } from "@mui/icons-material";

type PageParams = {sdSlug:string }

export default function AdminPagesClient() {
  const [config, setConfig] = useState<ConfigurationInterface>(null);
  const [showAddTab, setShowAddTab] = useState<boolean>(false);
  const params = useParams<PageParams>()

  const loadData = () => {
    ConfigHelper.load(params.sdSlug).then((data) => { setConfig(data); });
  };

  const handleAddTab = () => {
    setShowAddTab(true);
  };

  const handleTabsUpdated = () => {
    setShowAddTab(false);
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
        {UserHelper.checkAccess(Permissions.contentApi.content.edit) && (
          <Tabs
            updatedFunction={handleTabsUpdated}
            showAddTab={showAddTab}
            onAddTabComplete={() => setShowAddTab(false)}
          />
        )}
      </Box>
    </AdminWrapper>
  );
}
