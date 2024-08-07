import React, { useEffect, useState } from "react";
import { Grid } from "@mui/material";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { AdminWrapper } from "./AdminWrapper";
import { ApiHelper, LinkInterface, SmallButton } from "@churchapps/apphelper";
import { PageInterface } from "@/helpers";
import router from "next/router";
import { SiteNavigation } from "./SiteNavigation";
import { useWindowWidth } from "@react-hook/window-size";
import Link from "next/link";
import { AddPageModal } from "./site/AddPageModal";
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { DroppableWrapper } from "./DroppableWrapper";
import { DraggableWrapper } from "./DraggableWrapper";

interface Props {
  config: ConfigurationInterface;
  pageTitle?: string;
  children: React.ReactNode;
}

export const AdminSiteWrapper: React.FC<Props> = (props) => {
  const { isAuthenticated } = ApiHelper;
  const [links, setLinks] = useState<LinkInterface[]>([]);
  const [pages, setPages] = useState<PageInterface[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [addMode, setAddMode] = useState<string>("");
  const windowWidth = useWindowWidth();

  const loadData = () => {
    if (!isAuthenticated) return;

    ApiHelper.get("/pages", "ContentApi").then((_pages) => {
      let filteredPages:PageInterface[] = [];
      _pages.forEach((p:PageInterface) => {
        if (!p.url?.startsWith("/stream/") && !p.url?.startsWith("/member/")) filteredPages.push(p);
      });
      setPages(filteredPages || [])
    });

    ApiHelper.get("/links?category=website", "ContentApi").then(data => { setLinks(data); });
  };


  useEffect(() => { if (!isAuthenticated) router.push("/login"); }, []);
  useEffect(loadData, [isAuthenticated]);

  const navigationHandler = (errorMessage: string, url: string) => {
    let errors: string[] = [];

    if (windowWidth > 882){
      router.push(url);
    } else {
      errors.push(errorMessage);
    }

    if (errors.length > 0) {
      setErrors(errors);
      return;
    }
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

  }

  const getUnlinkedPages = () => {
    const unlinkedPages = pages.filter(p => !links.find(l => l.url === p.url));
    const result = unlinkedPages.map((page) =>

    //const clickHandler = () => navigationHandler("Page editor is only accessible on desktop", "/admin/site/pages/" + page.id);

      (
        <tr key={page.id}>
          <td>
            <DraggableWrapper dndType="navItemPage" data={{page, link:null}}>
              <Link href={"/admin/site/pages/preview/" + page.id}>{page.title}</Link>
            </DraggableWrapper>
          </td>
        </tr>
      )
    );
    return result;
  }

  const addLinkCallback = (page:PageInterface, link:LinkInterface) => {
    loadData();
    setAddMode("");
    if (page) {
      if (link) router.push("/admin/site/pages/preview/" + page.id + "?linkId=" + link.id);
      else router.push("/admin/site/pages/preview/" + page.id);
    }
  }

  return (
    <AdminWrapper config={props.config}>
      {(addMode!=="") && <AddPageModal updatedCallback={addLinkCallback} onDone={() => { setAddMode("") } } mode={addMode} />}

      <Grid container spacing={3}>
        <Grid item md={2} xs={12} style={{backgroundColor:"#FFF", minHeight:"100vh", marginTop:-7}}>
          <DndProvider backend={HTML5Backend}>
            <h2 style={{marginTop:0}}>Pages</h2>
            <span style={{float:"right"}}>
              <SmallButton icon="add" onClick={() => { setAddMode("navigation") }} />
            </span>
            <h3>Main Navigation</h3>
            <SiteNavigation links={links} pages={pages} refresh={loadData} select={(link, page) => {}} handleDrop={handleDrop} />

            <span style={{float:"right", paddingTop:15}}>
              <SmallButton icon="add" onClick={() => { setAddMode("unlinked") }} />
            </span>
            <h3>Not Linked</h3>
            <table className="table">
              {getUnlinkedPages() }
            </table>
            <DroppableWrapper accept={["navItemPage"]} onDrop={(item) => {handleDrop(0, "unlinked", item.data.page, item.data.link)}} hideWhenInactive={true}><div style={{height:5}}></div></DroppableWrapper>
          </DndProvider>
        </Grid>
        <Grid item md={10} xs={12}>
          {props.children}
        </Grid>
      </Grid>

    </AdminWrapper>
  );
};
