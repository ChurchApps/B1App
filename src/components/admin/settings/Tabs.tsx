import React, { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Divider
} from "@mui/material";
import {
  Edit as EditIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Tab as TabIcon
} from "@mui/icons-material";
import { UserHelper } from "@churchapps/apphelper/dist/helpers/UserHelper";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import { B1LinkInterface } from "@/helpers";
import { TabEdit } from "./TabEdit";
import { CardWithHeader, EmptyState } from "@/components/ui";

interface Props {
  updatedFunction?: () => void;
  showAddTab?: boolean;
  onAddTabComplete?: () => void;
}

export function Tabs({ updatedFunction = () => {}, showAddTab = false, onAddTabComplete = () => {} }: Props) {
  const [tabs, setTabs] = useState<B1LinkInterface[]>([]);
  const [currentTab, setCurrentTab] = useState<B1LinkInterface>(null);

  const handleAdd = () => {
    const tab: B1LinkInterface = { 
      churchId: UserHelper.currentUserChurch.church.id, 
      sort: tabs.length, 
      text: "", 
      url: "", 
      icon: "home", 
      linkData: "", 
      linkType: "url", 
      category: "b1Tab" 
    };
    setCurrentTab(tab);
  };

  const handleUpdated = () => {
    setCurrentTab(null);
    loadData();
    updatedFunction();
    onAddTabComplete();
  };

  const loadData = () => {
    ApiHelper.get("/links?category=b1Tab", "ContentApi").then((data) => setTabs(data));
  };

  const saveChanges = () => {
    ApiHelper.post("/links", tabs, "ContentApi").then(loadData);
  };

  const makeSortSequential = () => {
    for (let i = 0; i < tabs.length; i++) tabs[i].sort = i + 1;
  };

  const moveUp = (idx: number) => {
    makeSortSequential();
    tabs[idx - 1].sort++;
    tabs[idx].sort--;
    saveChanges();
  };

  const moveDown = (idx: number) => {
    makeSortSequential();
    tabs[idx].sort++;
    tabs[idx + 1].sort--;
    saveChanges();
  };

  const handleEdit = (tab: B1LinkInterface) => {
    setCurrentTab(tab);
  };

  const renderTabItem = (tab: B1LinkInterface, index: number) => (
    <React.Fragment key={index}>
      <ListItem sx={{ py: 2 }}>
        <ListItemIcon>
          <Box 
            sx={{ 
              backgroundColor: 'primary.main',
              borderRadius: '8px',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}
          >
            <TabIcon sx={{ fontSize: 20 }} />
          </Box>
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {tab.text || "Untitled Tab"}
            </Typography>
          }
          secondary={
            <Typography variant="body2" color="text.secondary">
              {tab.linkType === 'url' ? tab.url : `${tab.linkType} - ${tab.linkData}`}
            </Typography>
          }
        />
        <ListItemSecondaryAction>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Move up" arrow>
              <span>
                <IconButton
                  size="small"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  sx={{ color: 'text.secondary' }}
                >
                  <ArrowUpIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Move down" arrow>
              <span>
                <IconButton
                  size="small"
                  onClick={() => moveDown(index)}
                  disabled={index === tabs.length - 1}
                  sx={{ color: 'text.secondary' }}
                >
                  <ArrowDownIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Edit tab" arrow>
              <IconButton
                size="small"
                onClick={() => handleEdit(tab)}
                sx={{ color: 'primary.main' }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </ListItemSecondaryAction>
      </ListItem>
      {index < tabs.length - 1 && <Divider />}
    </React.Fragment>
  );

  useEffect(loadData, []);

  useEffect(() => {
    if (showAddTab && !currentTab) {
      handleAdd();
    }
  }, [showAddTab]);

  if (currentTab !== null) {
    return <TabEdit currentTab={currentTab} updatedFunction={handleUpdated} />;
  }

  return (
    <CardWithHeader
      title="Navigation Tabs"
      icon={<TabIcon />}
    >
      {tabs.length === 0 ? (
        <EmptyState
          icon={<TabIcon />}
          title="No navigation tabs"
          description="Create your first navigation tab to get started with your mobile app."
          variant="card"
        />
      ) : (
        <List sx={{ p: 0 }}>
          {tabs.map((tab, index) => renderTabItem(tab, index))}
        </List>
      )}
    </CardWithHeader>
  );
}
