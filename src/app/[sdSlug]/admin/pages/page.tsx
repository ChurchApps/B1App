"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { UserHelper } from "@churchapps/apphelper";
import { PageHeader } from "@churchapps/apphelper";
import { Permissions } from "@churchapps/helpers";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { ConfigHelper, ConfigurationInterface } from "@/helpers/ConfigHelper";
import { PageInterface } from "@/helpers";
import { PageEdit } from "@/components/admin/PageEdit";
import { Box, Button } from "@mui/material";
import { Article as ArticleIcon, Add as AddIcon, Visibility as VisibilityIcon } from "@mui/icons-material";
import { EmbeddablePages } from "@/components/admin/EmbeddablePages";

type PageParams = {sdSlug:string }

export default function AdminPagesClient() {
  const [config, setConfig] = useState<ConfigurationInterface>(null);
  const [editPage, setEditPage] = useState<PageInterface>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pageCount, setPageCount] = useState<number>(0);
  const params = useParams<PageParams>()

  const loadData = () => {
    ConfigHelper.load(params.sdSlug).then((data) => { setConfig(data); });
  };

  const handleAddPage = () => {
    setEditPage({ url:"/member/page-name", layout:"embed" });
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AdminWrapper config={config}>
      <PageHeader
        icon={<ArticleIcon />}
        title="Pages"
        subtitle="Manage member portal pages and content"
        statistics={[
          {
            icon: <VisibilityIcon />,
            value: pageCount.toString(),
            label: "Pages"
          }
        ]}
      >
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddPage}
          sx={{
            color: '#FFF',
            borderColor: 'rgba(255,255,255,0.5)',
            '&:hover': {
              borderColor: '#FFF',
              backgroundColor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          Add Page
        </Button>
      </PageHeader>

      {/* Main Content */}
      <Box sx={{ p: 3 }}>
        {editPage && (
          <Box sx={{ mb: 3 }}>
            <PageEdit
              page={editPage}
              updatedCallback={() => { setEditPage(null); setRefreshKey(Math.random()) }}
              embedded={true}
            />
          </Box>
        )}

        {UserHelper.checkAccess(Permissions.contentApi.content.edit) && (
          <EmbeddablePages
            onSelected={(page:PageInterface) => { setEditPage(page); }}
            pathPrefix="/member"
            refreshKey={refreshKey}
            onPageCountChange={setPageCount}
          />
        )}
      </Box>
    </AdminWrapper>
  );
}
