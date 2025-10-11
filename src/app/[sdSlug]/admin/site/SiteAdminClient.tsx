"use client";

import React, { useEffect, useState } from "react";
import { EnvironmentHelper, PageLink, WrapperPageProps } from "@/helpers";
import { ErrorMessages } from "@churchapps/apphelper";
import { useWindowWidth } from "@react-hook/window-size";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { SiteAdminWrapper } from "@/components/admin/SiteAdminWrapper";
import { PageHelper } from "@/helpers/PageHelper";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Card,
  Typography,
  Box,
  Stack,
  Chip,
  IconButton
} from "@mui/material";
import {
  Add as AddIcon,
  Article as ArticleIcon,
  Edit as EditIcon,
  Transform as TransformIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Description as DescriptionIcon,
  Public as PublicIcon
} from "@mui/icons-material";
import { AddPageModal } from "@/components/admin/site/AddPageModal";
import { useRouter } from "next/navigation";
import { PageHeader } from "@churchapps/apphelper";
import { EmptyState } from "@/components/ui";

export function SiteAdminClient(props: WrapperPageProps) {
  const windowWidth = useWindowWidth();
  const router = useRouter();
  EnvironmentHelper.initLocale();
  const [pageTree, setPageTree] = useState<PageLink[]>([]);
  const [addMode, setAddMode] = useState<string>("");
  const [requestedSlug, setRequestedSlug] = useState<string>("");

  const getExpandControl = (item:PageLink, level:number) => {
    if (item.children && item.children.length > 0) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", ml: level * 2 }}>
          <IconButton
            size="small"
            onClick={() => { item.expanded = !item.expanded; setPageTree([...pageTree]); }}
            sx={{ p: 0.5 }}
          >
            {item.expanded
              ? <ExpandMoreIcon fontSize="small" />
              : <ChevronRightIcon fontSize="small" />}
          </IconButton>
        </Box>
      );
    }
    else return <Box sx={{ width: 32, ml: level * 2 }}></Box>;
  }

  const getTreeLevel = (items:PageLink[], level:number) => {
    const result: React.ReactElement[] = [];
    items.forEach((item) => {
      result.push(
        <TableRow
          key={item.url}
          sx={{
            '&:hover': { backgroundColor: 'action.hover' },
            transition: 'background-color 0.2s ease'
          }}
        >
          <TableCell sx={{ width: 120 }}>
            {item.custom
              ? (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => {router.push("/admin/site/pages/preview/" + item.pageId)}}
                  data-testid="edit-page-button"
                  sx={{
                    textTransform: 'none',
                    minWidth: 'auto',
                    fontSize: '0.75rem'
                  }}
                >
                  Edit
                </Button>
              )
              : (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<TransformIcon />}
                  onClick={() => {
                    if (confirm("Would you like to convert this auto-generated page to a custom page?")) {
                      setRequestedSlug(item.url);
                      setAddMode("unlinked");
                    }
                  }}
                  color="secondary"
                  data-testid="convert-page-button"
                  sx={{
                    textTransform: 'none',
                    minWidth: 'auto',
                    fontSize: '0.75rem'
                  }}
                >
                  Convert
                </Button>
              )}
          </TableCell>
          <TableCell>
            <Stack direction="row" alignItems="center" spacing={1}>
              {getExpandControl(item, level)}
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {item.url}
              </Typography>
              {!item.custom && (
                <Chip
                  label="Generated"
                  size="small"
                  color="default"
                  sx={{
                    fontSize: '0.7rem',
                    height: 18
                  }}
                />
              )}
            </Stack>
          </TableCell>
          <TableCell>
            <Typography variant="body2">
              {item.title}
            </Typography>
          </TableCell>
        </TableRow>
      );
      if (item.expanded && item.children) result.push(...getTreeLevel(item.children, level+1));
    });
    return result;
  }

  const loadData = () => {
    PageHelper.loadPageTree().then((data) => { setPageTree(data); });
  }

  const getPageStats = () => {
    const countPages = (items: PageLink[]): { custom: number, auto: number, total: number } => {
      let custom = 0;
      let auto = 0;

      items.forEach((item) => {
        if (item.custom) custom++;
        else auto++;

        if (item.children) {
          const childStats = countPages(item.children);
          custom += childStats.custom;
          auto += childStats.auto;
        }
      });

      return { custom, auto, total: custom + auto };
    };

    return countPages(pageTree);
  }

  useEffect(() => {
    loadData();
  }, []);


  const pageStats = getPageStats();

  if (windowWidth < 882) {
    return <ErrorMessages errors={["Page editor is only available in desktop mode"]} />;
  }

  return (
    <>
      {(addMode!=="") && <AddPageModal updatedCallback={() => { loadData(); setAddMode(""); setRequestedSlug(""); }} onDone={() => { setAddMode(""); setRequestedSlug(""); } } mode={addMode} requestedSlug={requestedSlug} />}
      <AdminWrapper config={props.config}>
        <PageHeader
          icon={<ArticleIcon />}
          title="Website Pages"
          subtitle="Manage your website pages, content, and navigation"
          statistics={[
            { icon: <DescriptionIcon />, value: pageStats.total.toString(), label: "Total Pages" },
            { icon: <EditIcon />, value: pageStats.custom.toString(), label: "Custom Pages" },
            { icon: <PublicIcon />, value: pageStats.auto.toString(), label: "Auto-generated" }
          ]}
        >
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => { setAddMode("unlinked"); }}
            data-testid="add-page-button"
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
        <SiteAdminWrapper config={props.config}>
          <Box sx={{ p: 3 }}>
            <Card sx={{
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'grey.200'
            }}>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ArticleIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      Pages
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Below is a list of custom and auto-generated pages. You can add new pages, edit existing ones, or convert auto-generated pages to custom pages.
                </Typography>

                {pageTree.length === 0
                  ? (
                    <EmptyState
                      icon={<ArticleIcon />}
                      title="No pages found"
                      description="Get started by adding your first page."
                      action={
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => { setAddMode("unlinked"); }}
                        >
                          Add First Page
                        </Button>
                      }
                      variant="card"
                    />
                  )
                  : (
                    <Table sx={{ minWidth: 650 }}>
                      <TableHead
                        sx={{
                          backgroundColor: 'grey.50',
                          '& .MuiTableCell-root': {
                            borderBottom: '2px solid',
                            borderBottomColor: 'divider'
                          }
                        }}
                      >
                        <TableRow>
                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              Actions
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              Path
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              Title
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {getTreeLevel(pageTree, 0)}
                      </TableBody>
                    </Table>
                  )}
              </Box>
            </Card>
          </Box>
        </SiteAdminWrapper>
      </AdminWrapper>
    </>
  );
}
