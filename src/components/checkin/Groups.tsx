import React, { useState, useEffect } from "react";
import { Button, Icon, Grid } from "@mui/material";
import { CheckinHelper } from "@/helpers";
import { GroupInterface } from "@churchapps/apphelper";

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
    <div className="checkinGroup">
      <a
        href="about:blank"
        onClick={(e) => {
          e.preventDefault();
          selectedHandler(g);
        }}
      >
        {g.name}
      </a>
    </div>
  );

  const selectCategory = (category: GroupCategoryInterface) => {
    if (selectedCategory === category) setSelectedCategory(null);
    else setSelectedCategory(category);
  };

  const getCategory = (category: GroupCategoryInterface) => {
    const arrow = category === selectedCategory ? <Icon>keyboard_arrow_down</Icon> : <Icon>keyboard_arrow_right</Icon>;
    const groupList = category === selectedCategory ? getGroups() : null;
    return (
      <>
        <a
          href="about:blank"
          className="bigLinkButton checkinPerson"
          onClick={(e) => {
            e.preventDefault();
            selectCategory(category);
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={1}>
              {arrow}
            </Grid>
            <Grid item xs={11}>
              {category.name}
            </Grid>
          </Grid>
        </a>
        {groupList}
      </>
    );
  };

  useEffect(buildTree, []);

  return (
    <>
      {getCategories()}
      <br />
      <Button
        color="error"
        variant="contained"
        fullWidth
        size="large"
        onClick={() => {
          selectedHandler({ id: "", name: "NONE" });
        }}
        data-testid="checkin-none-button"
      >
        NONE
      </Button>
    </>
  );
}
