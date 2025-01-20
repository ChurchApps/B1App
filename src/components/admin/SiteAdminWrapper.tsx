"use client";
import React, { useEffect, useState } from "react";
import { Grid, Icon, Stack, Switch, Tooltip, Typography } from "@mui/material";
import { ConfigHelper, ConfigurationInterface } from "@/helpers/ConfigHelper";
import { ApiHelper, GenericSettingInterface, LinkInterface, SmallButton, UserHelper } from "@churchapps/apphelper";
import { PageInterface } from "@/helpers";
import { redirect } from "next/navigation";
import { SiteNavigation } from "./SiteNavigation";
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { NavLinkEdit } from "./site/NavLinkEdit";

interface Props {
  config: ConfigurationInterface;
  pageTitle?: string;
  children: React.ReactNode;
}

export const SiteAdminWrapper: React.FC<Props> = (props) => {
  const { isAuthenticated } = ApiHelper;
  const [links, setLinks] = useState<LinkInterface[]>([]);
  const [editLink, setEditLink] = useState<LinkInterface>(null);
  const [pages, setPages] = useState<PageInterface[]>([]);
  const [showLogin, setShowLogin] = useState<GenericSettingInterface>();
  const checked = showLogin?.value === "true" ? true : false;

  const loadData = () => {
    if (!isAuthenticated) return;

    ApiHelper.get("/pages", "ContentApi").then((_pages) => {
      let filteredPages:PageInterface[] = [];
      _pages.forEach((p:PageInterface) => {
        if (!p.url?.startsWith("/stream/")) filteredPages.push(p);
      });
      setPages(filteredPages || [])
    });

    ApiHelper.get("/links?category=website", "ContentApi").then(data => { setLinks(data); });
    ApiHelper.get("/settings", "ContentApi").then((data: GenericSettingInterface[]) => {
      const loginSetting = data.filter(d => d.keyName === "showLogin");
      if (loginSetting) setShowLogin(loginSetting[0]);
    });
  };


  useEffect(() => { if (!isAuthenticated) redirect("/login"); }, []);
  useEffect(loadData, [isAuthenticated]);

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const setting: GenericSettingInterface = showLogin ? { ...showLogin, value: `${e.target.checked}` } : { keyName: "showLogin", value: `${e.target.checked}`, public: 1 }
    ApiHelper.post("/settings", [setting], "ContentApi").then(data => { setShowLogin(data[0]); });
  }

  const handleDrop = (index:number, parentId:string, page:PageInterface, link:LinkInterface) => {
    if (parentId==="") parentId = null;
    if (parentId === "unlinked") {
      //delete link
      if (link) ApiHelper.delete("/links/" + link.id, "ContentApi").then(() => { loadData(); });
    } else {
      if (link) {
        //move link
        link.parentId = parentId;
        link.sort = index;
        ApiHelper.post("/links", [link], "ContentApi").then(() => { loadData(); });
      } else {
        //add link
        const newLink:LinkInterface = {id:"", churchId:page.churchId, category:"website", url:page.url, linkType:"url", linkData:"", icon:"", text:page.title, sort:index, parentId:parentId};
        ApiHelper.post("/links", [newLink], "ContentApi").then(() => { loadData(); });
      }
    }
    ConfigHelper.clearCache("sdSlug=" + props.config.keyName);
  }

  const addLinkCallback = (link:LinkInterface) => {
    ConfigHelper.clearCache("sdSlug=" + props.config.keyName);
    loadData();
    setEditLink(null);
  }

  return (
    <>
      {(editLink) && <NavLinkEdit updatedCallback={addLinkCallback} onDone={() => { setEditLink(null); } } link={editLink} />}

      <Grid container spacing={3}>
        <Grid item md={2} xs={12} style={{backgroundColor:"#FFF", marginTop:25, paddingLeft:40}}>
          <DndProvider backend={HTML5Backend}>
            <h2 style={{marginTop:0}}>Pages</h2>
            <div>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Typography sx={{ fontSize: "13.5px", fontStyle: "italic" }}>Show Login</Typography>
                  <Tooltip title="Show login button in the navigation bar" arrow><Icon color="primary" sx={{ fontSize: "18px !important", cursor: "pointer" }}>info</Icon></Tooltip>
                </Stack>
                <Switch onChange={handleSwitchChange} checked={showLogin ? checked : true} inputProps={{ 'aria-label': "controlled" }} />
              </Stack>
            </div>
            <div>
              <span style={{float:"right"}}>
                <SmallButton icon="add" onClick={() => { setEditLink({churchId: UserHelper.currentUserChurch.church.id, category:"website", linkType:"url", sort:99, linkData:"", icon:""} ) }} />
              </span>
              <h3>Main Navigation</h3>
            </div>
            <SiteNavigation keyName={props.config.keyName} links={links} pages={pages} refresh={loadData} select={(link, page) => {}} handleDrop={handleDrop} />

          </DndProvider>
        </Grid>
        <Grid item md={10} xs={12}>
          {props.children}
        </Grid>
      </Grid>

    </>
  );
};
