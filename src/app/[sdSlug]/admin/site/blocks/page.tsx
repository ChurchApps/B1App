"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import { Loading } from "@churchapps/apphelper/dist/components/Loading";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { ConfigHelper, ConfigurationInterface } from "@/helpers/ConfigHelper";
import { BlockInterface } from "@/helpers";
import {
  TableRow,
  TableCell,
  Table,
  TableBody,
  TableHead,
  Box,
  Typography,
  Stack,
  Button,
  Card,
  Icon
} from "@mui/material";
import {
  SmartButton as BlockIcon,
  Add as AddIcon,
  Edit as EditIcon
} from "@mui/icons-material";
import Link from "next/link";
import { BlockEdit } from "@/components/admin/BlockEdit";

type PageParams = {sdSlug:string }

export default function AdminPagesClient() {
  const [config, setConfig] = useState<ConfigurationInterface>(null);
  const [blocks, setBlocks] = useState<BlockInterface[]>([]);
  const [editBlock, setEditBlock] = useState<BlockInterface>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams<PageParams>()

  const loadData = () => {
    setLoading(true);
    Promise.all([
      ConfigHelper.load(params.sdSlug),
      ApiHelper.get("/blocks", "ContentApi")
    ]).then(([configData, blocksData]) => {
      setConfig(configData);
      const filtered = blocksData.filter((block:BlockInterface) => block.blockType !== "footerBlock");
      setBlocks(filtered || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const [stats, setStats] = useState({ totalBlocks: 0 });

  useEffect(() => {
    if (blocks) {
      const totalBlocks = blocks.length;
      setStats({ totalBlocks });
    }
  }, [blocks]);

  const getRows = () => {
    const result: JSX.Element[] = [];

    if (blocks.length === 0) {
      result.push(
        <TableRow key="empty">
          <TableCell colSpan={3} sx={{ textAlign: "center", py: 6 }}>
            <Stack spacing={2} alignItems="center">
              <BlockIcon sx={{ fontSize: 48, color: "text.secondary" }} />
              <Typography variant="h6" color="text.secondary">
                No blocks found
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Get started by creating your first reusable block
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setEditBlock({ blockType: "elementBlock" })}
                sx={{ mt: 2 }}
              >
                Create First Block
              </Button>
            </Stack>
          </TableCell>
        </TableRow>
      );
      return result;
    }

    blocks.forEach((block, index) => {
      result.push(
        <TableRow
          key={block.id}
          sx={{
            "&:hover": { backgroundColor: "action.hover" },
            transition: "background-color 0.2s ease",
          }}
        >
          <TableCell>
            <Stack direction="row" spacing={1} alignItems="center">
              <BlockIcon sx={{ color: "var(--c1l2)", fontSize: 20 }} />
              <Link
                href={`/admin/site/blocks/${block.id}`}
                style={{
                  textDecoration: "none",
                  color: "var(--c1l2)",
                  fontWeight: 500
                }}
              >
                {block.name}
              </Link>
            </Stack>
          </TableCell>
          <TableCell>
            <Stack direction="row" spacing={1} alignItems="center">
              <Icon sx={{ color: "text.secondary", fontSize: 16 }}>
                {block.blockType === "elementBlock" ? "widgets" : "view_module"}
              </Icon>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {block.blockType === "elementBlock" ? "Element(s)" : "Section(s)"}
              </Typography>
            </Stack>
          </TableCell>
          <TableCell align="right">
            <Button
              size="small"
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setEditBlock(block)}
              data-testid={`edit-block-${block.id}-button`}
              sx={{
                textTransform: "none",
                minWidth: "auto"
              }}
            >
              Edit
            </Button>
          </TableCell>
        </TableRow>
      );
    });

    return result;
  };

  const getTableHeader = () => {
    if (blocks.length === 0) {
      return [];
    }

    return [
      <TableRow key="header">
        <TableCell sx={{ fontWeight: 600 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Name
          </Typography>
        </TableCell>
        <TableCell sx={{ fontWeight: 600 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Type
          </Typography>
        </TableCell>
        <TableCell sx={{ fontWeight: 600 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Actions
          </Typography>
        </TableCell>
      </TableRow>
    ];
  };

  const getTable = () => {
    if (loading) return <Loading />;

    return (
      <Table sx={{ minWidth: 650 }}>
        <TableHead
          sx={{
            backgroundColor: "grey.50",
            "& .MuiTableCell-root": {
              borderBottom: "2px solid",
              borderBottomColor: "divider",
            },
          }}
        >
          {getTableHeader()}
        </TableHead>
        <TableBody>{getRows()}</TableBody>
      </Table>
    );
  };

  if (loading) {
    return (
      <AdminWrapper config={config}>
        <Loading />
      </AdminWrapper>
    );
  }

  return (
    <AdminWrapper config={config}>
      {/* Modern Blue Header */}
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
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: "12px",
                p: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BlockIcon sx={{ fontSize: 32, color: "#FFF" }} />
            </Box>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 600,
                  mb: 0.5,
                  fontSize: { xs: "1.75rem", md: "2.125rem" },
                }}
              >
                Reusable Blocks
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "rgba(255,255,255,0.9)",
                  fontSize: { xs: "0.875rem", md: "1rem" },
                }}
              >
                Create and manage reusable content blocks for your website
              </Typography>
            </Box>
          </Stack>

          {/* Right side: Action Buttons */}
          <Stack
            direction="row"
            spacing={1}
            sx={{
              flexShrink: 0,
              justifyContent: { xs: "flex-start", md: "flex-end" },
              width: { xs: "100%", md: "auto" }
            }}
          >
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setEditBlock({ blockType: "elementBlock" })}
              data-testid="add-block-button"
              sx={{
                color: "#FFF",
                borderColor: "rgba(255,255,255,0.5)",
                "&:hover": {
                  borderColor: "#FFF",
                  backgroundColor: "rgba(255,255,255,0.1)",
                },
              }}
            >
              Add Block
            </Button>
          </Stack>
        </Stack>

        {/* Statistics Row */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={3}
          flexWrap="wrap"
          useFlexGap
          justifyContent="flex-start"
          sx={{ mt: 3 }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <BlockIcon sx={{ color: "#FFF", fontSize: 20 }} />
            <Typography variant="h6" sx={{ color: "#FFF", fontWeight: 600, mr: 1 }}>
              {stats.totalBlocks}
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)", fontSize: "0.875rem" }}>
              Total Blocks
            </Typography>
          </Stack>
        </Stack>
      </Box>

      {/* Main Content */}
      <Box sx={{ p: 3 }}>
        {/* Edit Block Modal/Form */}
        {editBlock && (
          <Box sx={{ mb: 3 }}>
            <BlockEdit
              block={editBlock}
              updatedCallback={() => {
                setEditBlock(null);
                loadData();
              }}
            />
          </Box>
        )}

        {/* Main Table Card */}
        <Card sx={{
          borderRadius: 2,
          border: "1px solid",
          borderColor: "grey.200"
        }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center">
                <BlockIcon />
                <Typography variant="h6">Blocks</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {stats.totalBlocks} {stats.totalBlocks === 1 ? "block" : "blocks"}
              </Typography>
            </Stack>
          </Box>
          <Box>{getTable()}</Box>
        </Card>
      </Box>
    </AdminWrapper>
  );
}
