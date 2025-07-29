"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { UserHelper } from "@churchapps/apphelper";
import { Permissions } from "@churchapps/helpers";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { ConfigHelper, ConfigurationInterface } from "@/helpers/ConfigHelper";
import { PageInterface } from "@/helpers";
import { PageEdit } from "@/components/admin/PageEdit";
import { Box, Button, Stack, Typography } from "@mui/material";
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
      {/* Modern Header following style guide */}
      <Box sx={{ backgroundColor: "var(--c1l2)", color: "#FFF", padding: "24px" }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 2, md: 4 }}
          alignItems={{ xs: "flex-start", md: "center" }}
          sx={{ width: "100%" }}
        >
          {/* Left side: Title and Icon */}
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
            <Box
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '12px',
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ArticleIcon sx={{ fontSize: 32, color: '#FFF' }} />
            </Box>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 600,
                  mb: 0.5,
                  fontSize: { xs: '1.75rem', md: '2.125rem' }
                }}
              >
                Pages
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: { xs: '0.875rem', md: '1rem' }
                }}
              >
                Manage member portal pages and content
              </Typography>
            </Box>
          </Stack>

          {/* Right side: Statistics and Actions */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 2, md: 3 }}
            alignItems={{ xs: "flex-start", md: "center" }}
            sx={{
              flexShrink: 0,
              justifyContent: { xs: "flex-start", md: "flex-end" },
              width: { xs: "100%", md: "auto" }
            }}
          >
            {/* Statistics */}
            <Stack direction="row" spacing={1} alignItems="center">
              <VisibilityIcon sx={{ color: "#FFF", fontSize: 20 }} />
              <Typography variant="h6" sx={{ color: "#FFF", fontWeight: 600, mr: 1 }}>
                {pageCount}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem' }}>
                Pages
              </Typography>
            </Stack>

            {/* Action Button */}
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
          </Stack>
        </Stack>
      </Box>

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
