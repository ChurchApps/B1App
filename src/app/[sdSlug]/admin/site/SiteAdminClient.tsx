"use client";

import React, { useEffect, useState } from "react";
import { EnvironmentHelper, PageLink, WrapperPageProps } from "@/helpers";
import { Banner } from "@churchapps/apphelper/dist/components/header/Banner";
import { DisplayBox } from "@churchapps/apphelper/dist/components/DisplayBox";
import { ErrorMessages } from "@churchapps/apphelper/dist/components/ErrorMessages";
import { SmallButton } from "@churchapps/apphelper/dist/components/SmallButton";
import { useWindowWidth } from "@react-hook/window-size";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { SiteAdminWrapper } from "@/components/admin/SiteAdminWrapper";
import { PageHelper } from "@/helpers/PageHelper";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { AddPageModal } from "@/components/admin/site/AddPageModal";
import { useRouter } from "next/navigation";

export function SiteAdminClient(props: WrapperPageProps) {
  const windowWidth = useWindowWidth();
  const router = useRouter();
  EnvironmentHelper.initLocale();
  const [pageTree, setPageTree] = useState<PageLink[]>([]);
  const [addMode, setAddMode] = useState<string>("");
  const [requestedSlug, setRequestedSlug] = useState<string>("");

  const getExpandControl = (item:PageLink, level:number) => {
    if (item.children && item.children.length > 0) {
      return <a style={{width:20, display:"inline-block", marginLeft:level*20}} href="about:blank" onClick={(e) => { e.preventDefault(); item.expanded = !item.expanded; setPageTree([...pageTree]); }}>
        {item.expanded ? "▼" : "►"}
      </a>;
    }
    else return <span style={{width:20, display:"inline-block", marginLeft:level*10}}></span>;

  }

  const getTreeLevel = (items:PageLink[], level:number) => {
    const result: React.ReactElement[] = [];
    items.forEach((item) => {
      result.push(<TableRow key={item.url}>
        <TableCell>{item.custom
          ? <SmallButton icon="edit" onClick={() => {router.push("/admin/site/pages/preview/" + item.pageId) }} data-testid="edit-page-button" />
          : <SmallButton icon="difference" onClick={() => { if (confirm("Would you like to convert this auto-generated page to a custom page?")) {  setRequestedSlug(item.url); setAddMode("unlinked"); }  }} color="secondary" data-testid="convert-page-button" />
        }</TableCell>
        <TableCell>{getExpandControl(item, level)}{item.url}</TableCell>
        <TableCell>{item.title}</TableCell>
        <TableCell>
          {item.custom.toString().replace("true", "Yes").replace("false", "No")}</TableCell>
      </TableRow>);
      if (item.expanded && item.children) result.push(...getTreeLevel(item.children, level+1));
    });
    return result;
  }

  const loadData = () => {
    PageHelper.loadPageTree().then((data) => { setPageTree(data); });
  }

  useEffect(() => {
    loadData();
  }, []);


  if (windowWidth < 882) {
    return <ErrorMessages errors={["Page editor is only available in desktop mode"]} />;
  }

  return (
    <>
      {(addMode!=="") && <AddPageModal updatedCallback={() => { loadData(); setAddMode(""); setRequestedSlug(""); }} onDone={() => { setAddMode(""); setRequestedSlug(""); } } mode={addMode} requestedSlug={requestedSlug} />}
      <AdminWrapper config={props.config}>
        <Banner><h1>Website</h1></Banner>
        <SiteAdminWrapper config={props.config}>
          <div id="mainContent">
            <DisplayBox headerText="Pages" headerIcon="article" editContent={<SmallButton icon="add" onClick={() => { setAddMode("unlinked"); }} data-testid="add-page-button" />}>
              <p>Below is a list of custom and auto-generated pages.  You can add new pages, edit existing ones, or convert auto-generate pages to custom pages.</p>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell></TableCell>
                    <TableCell><span style={{width:20, display:"inline-block"}}></span>Path</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Custom</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getTreeLevel(pageTree, 0)}
                </TableBody>
              </Table>
            </DisplayBox>
          </div>
        </SiteAdminWrapper>
      </AdminWrapper>
    </>
  );
}
