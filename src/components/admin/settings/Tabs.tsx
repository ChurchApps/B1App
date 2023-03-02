import { useState, useEffect } from "react";
import { Icon, Box } from "@mui/material";
import { DisplayBox } from "@/components";
import { B1LinkInterface, UserHelper, ApiHelper } from "@/helpers";
import { TabEdit } from "./TabEdit";

interface Props {
  updatedFunction?: () => void;
}

export function Tabs({ updatedFunction = () => {} }: Props) {
  const [tabs, setTabs] = useState<B1LinkInterface[]>([]);
  const [currentTab, setCurrentTab] = useState<B1LinkInterface>(null);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    const tab: B1LinkInterface = { churchId: UserHelper.currentUserChurch.church.id, sort: tabs.length, text: "", url: "", icon: "link", linkData: "", linkType: "url", category: "b1Tab" };
    setCurrentTab(tab);
  };

  const handleUpdated = () => {
    setCurrentTab(null);
    loadData();
    updatedFunction();
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

  const moveUp = (e: React.MouseEvent) => {
    e.preventDefault();
    const idx = parseInt(e.currentTarget.getAttribute("data-idx"));
    makeSortSequential();
    tabs[idx - 1].sort++;
    tabs[idx].sort--;
    saveChanges();
  };

  const moveDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const idx = parseInt(e.currentTarget.getAttribute("data-idx"));
    makeSortSequential();
    tabs[idx].sort++;
    tabs[idx + 1].sort--;
    saveChanges();
  };

  const getRows = () => {
    let idx = 0;
    let rows: JSX.Element[] = [];
    tabs.forEach((tab) => {
      const upLink = (idx === 0)
        ? null 
        : (<a href="about:blank" data-idx={idx} onClick={moveUp}><Icon>arrow_upward</Icon></a>);
      const downLink = (idx === tabs.length - 1) 
        ? null 
        : (<a href="about:blank" data-idx={idx} onClick={moveDown}><Icon>arrow_downward</Icon></a>);
      rows.push(
        <tr key={idx}>
          <td>
            <a href={tab.url}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Icon style={{ marginRight: 5 }}>{tab.icon}</Icon> {tab.text}
              </Box>
            </a>
          </td>
          <td style={{ textAlign: "right" }}>
            {upLink}
            {downLink}
            <a href="about:blank" onClick={(e: React.MouseEvent) => { e.preventDefault(); setCurrentTab(tab); }} >
              <Icon>edit</Icon>
            </a>
          </td>
        </tr>
      );
      idx++;
    });
    return rows;
  };

  const editContent = (
    <a href="about:blank" onClick={handleAdd}>
      <Icon>add</Icon>
    </a>
  );

  useEffect(loadData, []);

  if (currentTab !== null) {
    return <TabEdit currentTab={currentTab} updatedFunction={handleUpdated} />;
  }

  return (
    <DisplayBox headerIcon="folder" headerText="Tabs" editContent={editContent}>
      <table className="table">
        <tbody>{getRows()}</tbody>
      </table>
    </DisplayBox>
  );
}
