"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, FormControl, Grid, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import { ApiHelper, Loading } from "@churchapps/apphelper";
import type { GroupInterface } from "@churchapps/helpers";
import GroupCard from "./GroupCard";

interface Props {
  churchId: string;
  category?: string;
  label?: string;
  title?: string;
  showSearch?: boolean;
  showCategory?: boolean;
}

export const GroupsBrowser = (props: Props) => {
  const [groups, setGroups] = useState<GroupInterface[] | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");

  useEffect(() => {
    if (!props.churchId) return;
    ApiHelper.getAnonymous(`/groups/public/${props.churchId}/list`, "MembershipApi").then((data: any) => {
      setGroups(Array.isArray(data) ? data : []);
    });
  }, [props.churchId]);

  const filtered = useMemo(() => {
    if (!groups) return [];
    const lowerSearch = search.trim().toLowerCase();
    const presetCategory = props.category?.trim().toLowerCase();
    const presetLabel = props.label?.trim().toLowerCase();
    const userCategory = category.trim().toLowerCase();
    return groups.filter((g) => {
      if (presetCategory && (g.categoryName || "").toLowerCase() !== presetCategory) return false;
      if (presetLabel) {
        const labels = (g.labelArray || []).map((l) => (l || "").toLowerCase());
        if (!labels.includes(presetLabel)) return false;
      }
      if (userCategory && (g.categoryName || "").toLowerCase() !== userCategory) return false;
      if (lowerSearch) {
        const haystack = `${g.name || ""} ${g.about || ""} ${g.categoryName || ""}`.toLowerCase();
        if (!haystack.includes(lowerSearch)) return false;
      }
      return true;
    });
  }, [groups, search, category, props.category, props.label]);

  const categories = useMemo(() => {
    if (!groups) return [];
    return [...new Set(groups.map((g) => g.categoryName).filter(Boolean))] as string[];
  }, [groups]);

  if (!groups) return <Loading />;

  const showSearch = props.showSearch !== false;
  const showCategory = props.showCategory !== false && !props.category && categories.length > 1;

  return (
    <Box data-testid="groups-browser">
      {props.title && (
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
          {props.title}
        </Typography>
      )}
      {(showSearch || showCategory) && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {showSearch && (
            <Grid size={{ xs: 12, md: showCategory ? 8 : 12 }}>
              <TextField
                fullWidth
                placeholder="Search groups by name or description"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
                inputProps={{ "data-testid": "groups-browser-search" }}
              />
            </Grid>
          )}
          {showCategory && (
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  label="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  inputProps={{ "data-testid": "groups-browser-category" }}>
                  <MenuItem value="">All categories</MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
      )}
      <Grid container spacing={3}>
        {filtered.length > 0 ? (
          filtered.map((group) => (
            <Grid key={group.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <GroupCard group={group} />
            </Grid>
          ))
        ) : (
          <Grid size={{ xs: 12 }}>
            <Box data-testid="groups-browser-empty" sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
              No groups match your filters.
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};
