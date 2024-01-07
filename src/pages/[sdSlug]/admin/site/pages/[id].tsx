import { CSSProperties, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Button, Drawer, Grid, Icon, ThemeProvider, ToggleButton, ToggleButtonGroup, createTheme } from "@mui/material";
import { useWindowWidth } from "@react-hook/window-size";
import {  ConfigHelper, ElementInterface, GlobalStyleInterface, PageInterface, SectionInterface, WrapperPageProps } from "@/helpers";
import { Theme } from "@/components";
import { DisplayBox, ApiHelper, ArrayHelper, ChurchInterface, UserHelper, Permissions } from "@churchapps/apphelper";
import { Section } from "@/components/Section";
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import React from "react";
import { DroppableArea } from "@/components/admin/DroppableArea";
import { SectionBlock } from "@/components/SectionBlock";
import { GetStaticPaths, GetStaticProps } from "next";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { Helmet } from "react-helmet";
import { StyleHelper } from "@/helpers/StyleHelper";
import { ElementAdd } from "@/components/admin/ElementAdd";
import { ElementEdit } from "@/components/admin/ElementEdit";
import { SectionEdit } from "@/components/admin/SectionEdit";

interface Props extends WrapperPageProps {
  church: ChurchInterface,
  churchSettings: any,
  globalStyles: GlobalStyleInterface
};

export default function Admin(props: Props) {
  const { isAuthenticated } = ApiHelper
  const router = useRouter();
  const [page, setPage] = useState<PageInterface>(null);
  const [editSection, setEditSection] = useState<SectionInterface>(null);
  const [editElement, setEditElement] = useState<ElementInterface>(null);
  const [editorBarHeight, setEditorBarHeight] = useState(400);
  const [scrollTop, setScrollTop] = useState(0);
  const [deviceType, setDeviceType] = useState("desktop");
  const id = router.query.id?.toString() || "";
  const windowWidth = useWindowWidth();
  const [showDrawer, setShowDrawer] = useState(false);


  const zones:any = {
    cleanCentered: ["main"],
    embed: ["main"],
    headerFooter: ["main", "footer"],
  }

  useEffect(() => {
    if(!UserHelper.checkAccess(Permissions.contentApi.content.edit)){
      router.push("/admin/site");
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); }
  }, []);

  const loadData = () => {
    if (isAuthenticated && UserHelper.checkAccess(Permissions.contentApi.content.edit)) {
      ApiHelper.get("/pages/" + UserHelper.currentUserChurch.church.id + "/tree?id=" + id, "ContentApi").then(p => { setPage(p) });
    }
  }

  useEffect(loadData, [id]);

  //page editor only available for desktop
  useEffect(() => {
    if (windowWidth < 883){
      router.push("/admin/site");
    }
  }, [windowWidth]);

  const handleDrop = (data: any, sort: number, zone: string) => {
    if (data.data) {
      const section: SectionInterface = data.data;
      section.sort = sort;
      section.zone = zone;
      ApiHelper.post("/sections", [section], "ContentApi").then(() => { loadData() });
    }
    else {
      setEditSection({ sort, background: "#FFF", textColor: "dark", pageId: id, targetBlockId: data.blockId, zone: zone });
    }
  }

  const getAddSection = (s: number, zone: string, droppableAreaText?: string) => {
    const sort = s;
    return (<DroppableArea key={"addSection_" + zone + "_" + s.toString()} text={droppableAreaText} accept={["section", "sectionBlock"]} onDrop={(data) => handleDrop(data, sort, zone)} />);
    //return (<div style={{ textAlign: "center", background: "#EEE" }}><SmallButton icon="add" onClick={() => setEditSection({ sort, background: "#FFF", textColor: "light" })} toolTip="Add Section" /></div>)
  }

  const getSections = (zone: string) => {
    const result: JSX.Element[] = []
    result.push(getAddSection(0, zone));
    const sections = ArrayHelper.getAll(page?.sections, "zone", zone);
    sections.forEach(section => {
      if (section.targetBlockId) result.push(<SectionBlock key={section.id} section={section} churchSettings={props.config.appearance} onEdit={handleSectionEdit} onMove={() => { loadData() }} />)
      else result.push(<Section key={section.id} section={section} churchSettings={props.config.appearance} onEdit={handleSectionEdit} onMove={() => { loadData() }} />)
      result.push(getAddSection(section.sort + 0.1, zone));
    });
    return result;
  }

  const handleSectionEdit = (s: SectionInterface, e: ElementInterface) => {
    if (s) setEditSection(s);
    else if (e) setEditElement(e);
  }

  let rightBarStyle: CSSProperties = {}

  if (typeof window !== "undefined") {
    const editorBar = document.getElementById("editorBar");
    if(window.innerWidth > 900){
      if (window?.innerHeight) {
        const editorBarOffset = (editorBarHeight > window.innerHeight) ? (editorBarHeight - window.innerHeight) : 0;
        const bottomMargin = editorBarOffset === 0 ? 0 : 50;
        if (scrollTop >= 160 + editorBarOffset) rightBarStyle = { width: editorBar?.clientWidth, position: "fixed", marginTop: -160 - bottomMargin };
      }
      if (editorBar && editorBar.clientHeight !== editorBarHeight && editorBar.clientHeight > 0) setEditorBarHeight(editorBar.clientHeight)
    }
  }

  /*Todo: affix the sidebar with CSS instead*/
  useEffect(() => {
    const onScroll = (e:any) => { setScrollTop(e.target.documentElement.scrollTop); };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollTop]);


  const handleRealtimeChange = (element: ElementInterface) => {
    const p = { ...page };
    p.sections.forEach(s => {
      realtimeUpdateElement(element, s.elements);
    })
    setPage(p);
  }

  const realtimeUpdateElement = (element: ElementInterface, elements: ElementInterface[]) => {
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].id === element.id) elements[i] = element;
      //if (elements[i].elements?.length > 0) realtimeUpdateElement(element, element.elements);
    }
  }

  const getTheme = () => {
    //force mobile
    if (deviceType==="mobile") return createTheme({
      breakpoints: {
        values: { xs: 0, sm: 2000, md: 3000, lg: 4000, xl: 5000 },
      },
    });
    else return createTheme();
  }

  const getZoneBoxes = () => {
    let result:any[] = [];
    let idx = 0;
    zones[page?.layout]?.forEach((z: string) => {
      const sections = ArrayHelper.getAll(page?.sections, "zone", z);
      const name = z.substring(0, 1).toUpperCase() + z.substring(1, z.length);
      result.push(<DisplayBox key={"zone-" + z} headerText={"Edit Zone: " + name} headerIcon="article" editContent={<Button onClick={() => setShowDrawer(!showDrawer)}>Add Content</Button>}>
        <div style={{ height: (idx === 0) ? 600 : 300, overflowY: "scroll" }}>
          <ThemeProvider theme={getTheme()}>
            <div className="page" style={(deviceType==="mobile" ? {width:400, marginLeft:"auto", marginRight:"auto"} : {})}>
              {getSections(z)}
            </div>
          </ThemeProvider>
        </div>
        <div style={{ height: "31px" }}>{getAddSection(sections[sections.length - 1]?.sort + 0.1, z, "Drop at the bottom of page")}</div>
      </DisplayBox>);
      idx++;
    });
    return <>{result}</>

  }

  useEffect(() => {
    if (!showDrawer)
    {
      if (editSection || editElement) setShowDrawer(true);
    }
  }, [editSection,editElement]);


  return (<>
    <Theme appearance={props.churchSettings} globalStyles={props.globalStyles} />
    <Helmet><style>{StyleHelper.getCss(page?.sections || [], deviceType)}</style></Helmet>

    <AdminWrapper config={props.config}>
      <DndProvider backend={HTML5Backend}>
        <Drawer anchor="right" variant="persistent" open={showDrawer} onClose={() => {setShowDrawer(false)}}>
          <div id="editorBar" style={{width:"28vw", paddingTop:60}}>
            <div style={rightBarStyle}>
              {!editSection && !editElement && <ElementAdd includeBlocks={true} includeSection={true} updateCallback={() => { setShowDrawer(false); }} />}
              {editSection && <SectionEdit section={editSection} updatedCallback={() => { setEditSection(null); setShowDrawer(false); loadData(); }} globalStyles={props.globalStyles} />}
              {editElement && <ElementEdit element={editElement} updatedCallback={() => { setEditElement(null); setShowDrawer(false); loadData(); }} onRealtimeChange={handleRealtimeChange} globalStyles={props.globalStyles} />}
            </div>
          </div>
        </Drawer>
        <div style={(showDrawer) ? {maxWidth: "65vw"} : {}}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <h1 style={{marginTop:0}}>Edit Page</h1>
            </Grid>
            <Grid item xs={6} style={{textAlign:"right"}}>
              <ToggleButtonGroup value={deviceType} exclusive onChange={(e, newDeviceType) => { if (newDeviceType!==null) setDeviceType(newDeviceType) }} style={{backgroundColor:"#FFF"}}>
                <ToggleButton value="desktop">
                  <Icon>computer</Icon>
                </ToggleButton>
                <ToggleButton value="mobile">
                  <Icon>smartphone</Icon>
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>
          </Grid>

          {getZoneBoxes()}
        </div>
      </DndProvider>
    </AdminWrapper>
  </>);
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths:any[] = [];
  return { paths, fallback: "blocking", };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const config = await ConfigHelper.load(params.sdSlug.toString());
  const church: ChurchInterface = await ApiHelper.getAnonymous("/churches/lookup?subDomain=" + params.sdSlug, "MembershipApi");
  const churchSettings: any = await ApiHelper.getAnonymous("/settings/public/" + church.id, "MembershipApi");
  const globalStyles: GlobalStyleInterface = await ApiHelper.getAnonymous("/globalStyles/church/" + church.id, "ContentApi");
  return { props: { config, churchSettings, globalStyles }, revalidate: 30 };
};
