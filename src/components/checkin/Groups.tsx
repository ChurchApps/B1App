import React, { useState, useEffect } from "react";
import { Button, Icon, Grid, Box, Card, CardActionArea, Typography, Divider } from "@mui/material";
import { CheckinHelper } from "@/helpers";
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
        borderBottom: "1px solid #F0F0F0",
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
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "#FFFFFF",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginRight: 1.5,
            }}
          >
            <Icon sx={{ fontSize: 20, color: "#568BDA" }}>group</Icon>
          </Box>
          <Typography variant="body1" sx={{ flex: 1, color: "#3c3c3c", fontWeight: 500 }}>
            {g.name}
          </Typography>
          <Icon sx={{ color: "#9E9E9E", fontSize: 20 }}>chevron_right</Icon>
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
      <Card
        key={category.key}
        sx={{
          borderRadius: 3,
          marginBottom: 1.5,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        <CardActionArea
          onClick={() => selectCategory(category)}
          sx={{ padding: 2 }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: "#F6F6F8",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginRight: 1.5,
              }}
            >
              <Icon sx={{ fontSize: 24, color: "#0D47A1" }}>folder</Icon>
            </Box>
            <Typography variant="body1" sx={{ flex: 1, color: "#3c3c3c", fontWeight: 600 }}>
              {category.name || "General Groups"}
            </Typography>
            <Icon sx={{ color: "#9E9E9E" }}>
              {isExpanded ? "expand_less" : "expand_more"}
            </Icon>
          </Box>
        </CardActionArea>
        {isExpanded && (
          <>
            <Divider sx={{ backgroundColor: "#F0F0F0" }} />
            <Box sx={{ backgroundColor: "#F6F6F8" }}>{groupList}</Box>
          </>
        )}
      </Card>
    );
  };

  useEffect(buildTree, []);

  return (
    <>
      {/* Header Section */}
      <Box
        sx={{
          backgroundColor: "#FFFFFF",
          padding: 3,
          textAlign: "center",
          borderRadius: 2,
          marginBottom: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: "#F6F6F8",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            margin: "0 auto 16px",
          }}
        >
          <Icon sx={{ fontSize: 48, color: "#0D47A1" }}>groups</Icon>
        </Box>
        <Typography variant="h4" sx={{ color: "#3c3c3c", fontWeight: 700, marginBottom: 1 }}>
          Select Group
        </Typography>
        <Typography variant="body1" sx={{ color: "#9E9E9E", marginBottom: 1 }}>
          Choose a group for {CheckinHelper.selectedServiceTime?.name}
        </Typography>
      </Box>

      {/* Groups List */}
      {groupTree && groupTree.length > 0 ? (
        getCategories()
      ) : (
        <Card sx={{ borderRadius: 3, padding: 4, textAlign: "center" }}>
          <Icon sx={{ fontSize: 64, color: "#9E9E9E" }}>group_off</Icon>
          <Typography variant="h6" sx={{ color: "#3c3c3c", fontWeight: 600, marginTop: 2, marginBottom: 1 }}>
            No Groups Available
          </Typography>
          <Typography variant="body2" sx={{ color: "#9E9E9E" }}>
            There are no groups configured for this service
          </Typography>
        </Card>
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
            borderColor: "#9E9E9E",
            color: "#9E9E9E",
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
