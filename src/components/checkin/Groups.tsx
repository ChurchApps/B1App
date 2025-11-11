import React, { useState, useEffect } from "react";
import { Button, Icon, Grid, Box, CardActionArea, Typography, Divider } from "@mui/material";
import { CheckinHelper } from "@/helpers";
import { HeaderSection, HeaderIconContainer, CheckinCard, IconCircle, SmallIconCircle, EmptyStateCard, colors } from "./CheckinStyles";
import type { GroupInterface } from "@churchapps/helpers";

interface GroupCategoryInterface {
  key: number;
  name: string;
  items: GroupInterface[];
}

interface Props {
  selectedHandler: (group: GroupInterface) => void;
}

export function Groups({ selectedHandler }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<GroupCategoryInterface>(null);
  const [groupTree, setGroupTree] = useState<GroupCategoryInterface[]>([]);

  const buildTree = () => {
    let category = "";
    let gt: GroupCategoryInterface[] = [];

    const sortedGroups = CheckinHelper.selectedServiceTime?.groups?.sort((a, b) =>
      (a.categoryName || "") > (b.categoryName || "") ? 1 : -1
    );

    sortedGroups?.forEach((g) => {
      if (g.categoryName !== category) gt.push({ key: gt.length, name: g.categoryName || "", items: [] });
      gt[gt.length - 1].items.push(g);
      category = g.categoryName || "";
    });
    setGroupTree(gt);
  };

  const getCategories = () => {
    let result: React.ReactElement[] = [];
    groupTree.forEach((c) => {
      result.push(getCategory(c));
    });
    return result;
  };

  const getGroups = () => {
    let result: React.ReactElement[] = [];
    selectedCategory?.items?.forEach((g) => {
      result.push(getGroup(g));
    });
    return result;
  };

  const getGroup = (g: GroupInterface) => (
    <Box
      key={g.id}
      sx={{
        borderBottom: `1px solid ${colors.border}`,
        "&:last-child": {
          borderBottom: "none",
        },
      }}
    >
      <CardActionArea
        onClick={() => selectedHandler(g)}
        sx={{ padding: 2, paddingLeft: 3 }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <SmallIconCircle>
            <Icon sx={{ fontSize: 20, color: "#568BDA" }}>group</Icon>
          </SmallIconCircle>
          <Typography variant="body1" sx={{ flex: 1, color: colors.textPrimary, fontWeight: 500 }}>
            {g.name}
          </Typography>
          <Icon sx={{ color: colors.textSecondary, fontSize: 20 }}>chevron_right</Icon>
        </Box>
      </CardActionArea>
    </Box>
  );

  const selectCategory = (category: GroupCategoryInterface) => {
    if (selectedCategory === category) setSelectedCategory(null);
    else setSelectedCategory(category);
  };

  const getCategory = (category: GroupCategoryInterface) => {
    const isExpanded = category === selectedCategory;
    const groupList = isExpanded ? getGroups() : null;
    return (
      <CheckinCard key={category.key}>
        <CardActionArea
          onClick={() => selectCategory(category)}
          sx={{ padding: 2 }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconCircle size={40} sx={{ marginRight: 1.5 }}>
              <Icon sx={{ fontSize: 24, color: colors.primary }}>folder</Icon>
            </IconCircle>
            <Typography variant="body1" sx={{ flex: 1, color: colors.textPrimary, fontWeight: 600 }}>
              {category.name || "General Groups"}
            </Typography>
            <Icon sx={{ color: colors.textSecondary }}>
              {isExpanded ? "expand_less" : "expand_more"}
            </Icon>
          </Box>
        </CardActionArea>
        {isExpanded && (
          <>
            <Divider sx={{ backgroundColor: colors.border }} />
            <Box sx={{ backgroundColor: colors.backgroundLight }}>{groupList}</Box>
          </>
        )}
      </CheckinCard>
    );
  };

  useEffect(buildTree, []);

  return (
    <>
      {/* Header Section */}
      <HeaderSection>
        <HeaderIconContainer>
          <Icon sx={{ fontSize: 48, color: colors.primary }}>groups</Icon>
        </HeaderIconContainer>
        <Typography variant="h4" sx={{ color: colors.textPrimary, fontWeight: 700, marginBottom: 1 }}>
          Select Group
        </Typography>
        <Typography variant="body1" sx={{ color: colors.textSecondary, marginBottom: 1 }}>
          Choose a group for {CheckinHelper.selectedServiceTime?.name}
        </Typography>
      </HeaderSection>

      {/* Groups List */}
      {groupTree && groupTree.length > 0 ? (
        getCategories()
      ) : (
        <EmptyStateCard>
          <Icon sx={{ fontSize: 64, color: colors.textSecondary }}>group_off</Icon>
          <Typography variant="h6" sx={{ color: colors.textPrimary, fontWeight: 600, marginTop: 2, marginBottom: 1 }}>
            No Groups Available
          </Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary }}>
            There are no groups configured for this service
          </Typography>
        </EmptyStateCard>
      )}

      {/* Bottom Action */}
      <Box sx={{ marginTop: 3 }}>
        <Button
          variant="outlined"
          fullWidth
          size="large"
          onClick={() => {
            selectedHandler({ id: "", name: "NONE" });
          }}
          data-testid="checkin-none-button"
          startIcon={<Icon>close</Icon>}
          sx={{
            borderColor: colors.textSecondary,
            color: colors.textSecondary,
            borderRadius: 3,
            height: 48,
            fontWeight: 600,
          }}
        >
          No Group
        </Button>
      </Box>
    </>
  );
}
