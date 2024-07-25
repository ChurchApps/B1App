import { CSSProperties, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Drawer, Grid, Icon, ThemeProvider, ToggleButton, ToggleButtonGroup, Tooltip, createTheme } from "@mui/material";
import { useWindowWidth } from "@react-hook/window-size";
import {  BlockInterface, ElementInterface, GlobalStyleInterface, PageInterface, SectionInterface, WrapperPageProps } from "@/helpers";
import { Theme } from "@/components";
import { ApiHelper, ArrayHelper, ChurchInterface, UserHelper, Permissions, SmallButton } from "@churchapps/apphelper";
import { Section } from "@/components/Section";
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import React from "react";
import { DroppableArea } from "@/components/admin/DroppableArea";
import { SectionBlock } from "@/components/SectionBlock";
import { Helmet } from "react-helmet";
import { StyleHelper } from "@/helpers/StyleHelper";
import { ElementAdd } from "@/components/admin/elements/ElementAdd";
import { ElementEdit } from "@/components/admin/elements/ElementEdit";
import { SectionEdit } from "@/components/admin/SectionEdit";
import { DroppableScroll } from "../DroppableScroll";

interface Props extends WrapperPageProps {
  church: ChurchInterface,
  churchSettings: any,
  globalStyles: GlobalStyleInterface,
  loadData: (id:string) => Promise<any>,
  pageId?: string,
  blockId?: string
  onDone?: () => void
};

export default function ContentEditor(props: Props) {
  const { isAuthenticated } = ApiHelper
  const router = useRouter();
  const [container, setContainer] = useState<PageInterface | BlockInterface>(null);
  const [editSection, setEditSection] = useState<SectionInterface>(null);
  const [editElement, setEditElement] = useState<ElementInterface>(null);
  //const [editorBarHeight, setEditorBarHeight] = useState(400);
  const [scrollTop, setScrollTop] = useState(0);
  const [deviceType, setDeviceType] = useState("desktop");
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
      props.loadData(props.pageId || props.blockId).then((p: PageInterface | BlockInterface) => { setContainer(p) });
    }
  }

  useEffect(loadData, [props.pageId, props.blockId]);

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
      section.pageId = (zone==="footer") ? null : props.pageId;
      ApiHelper.post("/sections", [section], "ContentApi").then(() => { loadData() });
    }
    else {
      const sec = { sort, background: "#FFF", textColor: "dark", pageId: props.pageId, blockId:props.blockId, targetBlockId: data.blockId, zone: zone }
      if (sec.zone==="footer") sec.pageId = null;
      setEditSection(sec);
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
    const sections = (zone==="block") ? container?.sections : ArrayHelper.getAll(container?.sections, "zone", zone);
    sections?.forEach(section => {
      if (section.targetBlockId) result.push(<SectionBlock key={section.id} section={section} churchSettings={props.config.appearance} onEdit={handleSectionEdit} onMove={() => { loadData() }} />)
      else result.push(<Section key={section.id} section={section} churchSettings={props.config.appearance} onEdit={handleSectionEdit} onMove={() => { loadData() }} />)
      result.push(getAddSection(section.sort + 0.1, zone));
    });
    return result;
  }

  const handleSectionEdit = (s: SectionInterface, e: ElementInterface) => {
    if (s) setEditSection(s);
    else if (e) setEditElement(e);
    setShowDrawer(true);
  }

  let rightBarStyle: CSSProperties = {}

  if (typeof window !== "undefined") {
    const editorBar = document.getElementById("editorBar");
    if(window.innerWidth > 900){
      if (window?.innerHeight) {
        //const editorBarOffset = (editorBarHeight > window.innerHeight) ? (editorBarHeight - window.innerHeight) : 0;
        //const bottomMargin = editorBarOffset === 0 ? 0 : 50;
        //if (scrollTop >= 64 + editorBarOffset) rightBarStyle = { width: editorBar?.clientWidth, position: "fixed", marginTop: -64 - bottomMargin };
        if (scrollTop < 50) rightBarStyle = { paddingTop: 70 };
      }
      //if (editorBar && editorBar.clientHeight !== editorBarHeight && editorBar.clientHeight > 0) setEditorBarHeight(editorBar.clientHeight)
    }
  }

  /*Todo: affix the sidebar with CSS instead*/
  useEffect(() => {
    const onScroll = (e:any) => { setScrollTop(e.target.documentElement.scrollTop); };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollTop]);


  const handleRealtimeChange = (element: ElementInterface) => {
    const c = { ...container };
    c.sections.forEach(s => {
      realtimeUpdateElement(element, s.elements);
    })
    setContainer(c);
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

  //<div style={{ height: "31px" }}>{getAddSection(sections[sections.length - 1]?.sort + 0.1, keyName, "Drop at the bottom of page")}</div>
  const getZoneBox = (sections:SectionInterface[], name:string, keyName:string) => <div key={"zone-" + keyName}>
    <div style={{position:"absolute", backgroundColor:"#FFF", zIndex:100, padding:10, border:"1px solid #999", opacity:0.5  }}>Zone: {keyName}</div>
    <div>
      <ThemeProvider theme={getTheme()}>
        <div className="page" style={(deviceType==="mobile" ? {width:400, marginLeft:"auto", marginRight:"auto"} : {})}>
          {getSections(keyName)}
        </div>
      </ThemeProvider>
    </div>
    <div style={{ height: "31px"}}></div>
  </div>

  const getZoneBoxes = () => {
    let result:any[] = [];
    let idx = 0;
    if (props.pageId) {
      const page = container as PageInterface;
      zones[page?.layout]?.forEach((z: string) => {
        const sections = ArrayHelper.getAll(page?.sections, "zone", z);
        const name = z.substring(0, 1).toUpperCase() + z.substring(1, z.length);
        result.push(getZoneBox(sections, name, z));
        idx++;
      });
    } else {
      const block = container as BlockInterface;
      if (block) result.push(getZoneBox((container as BlockInterface)?.sections, "Block Preview", "block"));
    }
    return <>{result}</>
  }



  return (<>
    <Theme appearance={props.churchSettings} globalStyles={props.globalStyles} />
    <Helmet><style>{StyleHelper.getCss(container?.sections || [], deviceType)}</style></Helmet>

    <div style={{backgroundColor:"#FFF", position:"sticky", top:0, width:"100%", zIndex:1000, boxShadow:"0px 2px 2px black"}}>
      <Grid container spacing={2}>
        <Grid item xs={4} style={{paddingLeft:40, paddingTop:8}}>
          <SmallButton icon={"done"} text="Done" onClick={props.onDone} />
        </Grid>
        <Grid item xs={4} style={{textAlign:"center"}}>
          <b>
            {props.pageId && "Page: " + (container as PageInterface)?.title}
            {props.blockId && "Block: " + (container as BlockInterface)?.name}
          </b>
        </Grid>
        <Grid item xs={4} style={{textAlign:"right", paddingTop:5, paddingBottom:5, paddingRight:15}}>
          <div style={{float:"right", display:"flex", backgroundColor:"#1976d2" }}>
            <ToggleButtonGroup value={showDrawer.toString()} exclusive size="small">
              <ToggleButton value="true" onClick={() => setShowDrawer(!showDrawer)} style={{borderRight:"1px solid #FFF", color:"#FFF"}}><Tooltip title="Add Content" placement="top"><Icon>add</Icon></Tooltip></ToggleButton>
            </ToggleButtonGroup>
            <ToggleButtonGroup size="small" value={deviceType} exclusive onChange={(e, newDeviceType) => { if (newDeviceType!==null) setDeviceType(newDeviceType) }}>
              {deviceType==="desktop" && <ToggleButton size="small" value="mobile" style={{color:"#FFF"}}><Tooltip title="Desktop" placement="top"><Icon>computer</Icon></Tooltip></ToggleButton>}
              {deviceType==="mobile" && <ToggleButton size="small" value="desktop" style={{color:"#FFF"}}><Tooltip title="Mobile" placement="top"><Icon>smartphone</Icon></Tooltip></ToggleButton>}
            </ToggleButtonGroup>
          </div>
        </Grid>
      </Grid>
    </div>

    <DndProvider backend={HTML5Backend}>
      <Drawer anchor="right" variant="persistent" open={showDrawer} onClose={() => {setShowDrawer(false)}} PaperProps={{sx:{zIndex:0}}}>
        <div id="editorBar" style={{width:"28vw", position:"sticky", top:0}}>
          <div style={rightBarStyle}>
            {!editSection && !editElement && <ElementAdd includeBlocks={true} includeSection={true} updateCallback={() => { setShowDrawer(false); }} />}
            {editSection && <SectionEdit section={editSection} updatedCallback={() => { setEditSection(null); setShowDrawer(false); loadData(); }} globalStyles={props.globalStyles} />}
            {editElement && <ElementEdit element={editElement} updatedCallback={() => { setEditElement(null); setShowDrawer(false); loadData(); }} onRealtimeChange={handleRealtimeChange} globalStyles={props.globalStyles} />}
          </div>
        </div>
      </Drawer>
      <div style={(showDrawer) ? {maxWidth: "65vw"} : {}}>
        {scrollTop>150
          && <div style={{position:"fixed", bottom:30, zIndex:1000, width:500, marginLeft:300}}>
            <DroppableScroll key={"scrollDown"} text={"Scroll Down"} direction="down"  />
          </div>}
        {scrollTop>150 && <div style={{position:"fixed", top: 50, zIndex:1000, width:500, marginLeft:300}}>
          <DroppableScroll key={"scrollUp"} text={"Scroll Up"} direction="up" />
        </div> }


        <h1 style={{marginTop:-50}}>Edit Page</h1>
        {getZoneBoxes()}
      </div>
    </DndProvider>

  </>);
}
