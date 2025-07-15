import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Box,
  IconButton,
  Skeleton
} from "@mui/material";
import {
  Article as ArticleIcon,
  Edit as EditIcon,
  Add as AddIcon,
  OpenInNew as OpenInNewIcon
} from "@mui/icons-material";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import { PageInterface } from "@/helpers";

type Props = {
  onSelected: (page:PageInterface) => void,
  pathPrefix: string,
  refreshKey?: number,
  onPageCountChange?: (count: number) => void,
};

export function EmbeddablePages(props:Props) {
  const [pages, setPages] = useState<PageInterface[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    ApiHelper.get("/pages", "ContentApi").then((_pages:PageInterface[]) => {
      let filteredPages:PageInterface[] = [];
      _pages.forEach(p => { if (p.url.startsWith(props.pathPrefix)) filteredPages.push(p); });
      setPages(filteredPages || []);
      props.onPageCountChange?.(filteredPages?.length || 0);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  };

  useEffect(loadData, [props.refreshKey]);

  const handleAddPage = () => {
    props.onSelected({ url: props.pathPrefix + "/page-name", layout: "embed" });
  };

  // Loading state
  if (loading) {
    return (
      <Card sx={{ 
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'grey.200'
      }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <ArticleIcon sx={{ color: 'text.primary' }} />
            <Typography variant="h6" sx={{ color: 'text.primary' }}>
              Pages
            </Typography>
          </Stack>
        </Box>
        <CardContent>
          {[...Array(3)].map((_, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Skeleton variant="text" height={40} />
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (pages.length === 0) {
    return (
      <Card sx={{ 
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'grey.200'
      }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <ArticleIcon sx={{ color: 'text.primary' }} />
            <Typography variant="h6" sx={{ color: 'text.primary' }}>
              Pages
            </Typography>
          </Stack>
        </Box>
        <Box sx={{ p: 6, textAlign: 'center' }}>
          <ArticleIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Pages Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Get started by creating your first member portal page.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            size="large"
            onClick={handleAddPage}
            sx={{ 
              textTransform: 'none',
              borderRadius: 2,
              fontWeight: 600
            }}
          >
            Create First Page
          </Button>
        </Box>
      </Card>
    );
  }

  // Pages table
  const pagesUi = pages.map((page) => (
    <TableRow
      key={page.id}
      sx={{
        '&:hover': { backgroundColor: 'action.hover' },
        transition: 'background-color 0.2s ease'
      }}
    >
      <TableCell>
        <Link
          href={"/admin/site/pages/" + page.id}
          style={{
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 500
          }}
        >
          {page.url}
        </Link>
      </TableCell>
      <TableCell>
        <Link
          href={"/admin/site/pages/" + page.id}
          style={{
            textDecoration: 'none',
            color: 'inherit'
          }}
        >
          {page.title}
        </Link>
      </TableCell>
      <TableCell align="right">
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <IconButton
            size="small"
            onClick={() => { props.onSelected(page); }}
            sx={{
              color: 'primary.main',
              '&:hover': { backgroundColor: 'primary.50' }
            }}
            aria-label="Edit page"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            component={Link}
            href={"/admin/site/pages/" + page.id}
            sx={{
              color: 'text.secondary',
              '&:hover': { backgroundColor: 'action.hover' }
            }}
            aria-label="Open page editor"
          >
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  ));

  return (
    <Card sx={{
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'grey.200'
    }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <ArticleIcon sx={{ color: 'text.primary' }} />
          <Typography variant="h6" sx={{ color: 'text.primary' }}>
            Pages ({pages.length})
          </Typography>
        </Stack>
      </Box>
      <Box>
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
                  Path
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Title
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Actions
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>{pagesUi}</TableBody>
        </Table>
      </Box>
    </Card>
  );
}
