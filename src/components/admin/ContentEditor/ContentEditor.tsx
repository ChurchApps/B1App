"use client";
import { CSSProperties, useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { Container, Dialog, Grid, Icon, ThemeProvider, ToggleButton, ToggleButtonGroup, Tooltip, createTheme } from "@mui/material";
import { useWindowWidth } from "@react-hook/window-size";
import { BlockInterface, ElementInterface, PageInterface, SectionInterface, WrapperPageProps } from "@/helpers";
import { Theme } from "@/components";
import { ApiHelper, ArrayHelper, UserHelper, Permissions, SmallButton, DisplayBox } from "@churchapps/apphelper";
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
import { Header } from "@/components/Header";

interface Props extends WrapperPageProps {
  loadData: (id: string) => Promise<any>,
  pageId?: string,
  blockId?: string
  onDone?: (url?: string) => void
};

export default function ContentEditor(props: Props) {
  const { isAuthenticated } = ApiHelper
  const [container, setContainer] = useState<PageInterface | BlockInterface>(null);
  const [editSection, setEditSection] = useState<SectionInterface>(null);
  const [editElement, setEditElement] = useState<ElementInterface>(null);
  //const [editorBarHeight, setEditorBarHeight] = useState(400);
  const [scrollTop, setScrollTop] = useState(0);
  const [deviceType, setDeviceType] = useState("desktop");
  const windowWidth = useWindowWidth();

  const [showAdd, setShowAdd] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [navLinks, setNavLinks] = useState<any>(null);

  let elementOnlyMode = false;
  if (props.blockId && container?.sections?.length===1 && container?.sections[0]?.id==="") elementOnlyMode = true;

  const zones: any = {
    cleanCentered: ["main"],
    embed: ["main"],
    headerFooter: ["main", "footer"],
  }

  useEffect(() => {
    if (!UserHelper.checkAccess(Permissions.contentApi.content.edit)) {
      redirect("/admin/site");
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { redirect("/login"); }
  }, []);

  const loadData = () => {
    if (isAuthenticated && UserHelper.checkAccess(Permissions.contentApi.content.edit)) {
      props.loadData(props.pageId || props.blockId).then((p: PageInterface | BlockInterface) => { setContainer(p) });
    }
  }

  const loadLinks = () => {
    if (props.config?.church) ApiHelper.getAnonymous("/links/church/" + props.config?.church.id + "?category=website", "ContentApi").then((data) => { setNavLinks(data) });
  }

  useEffect(loadData, [props.pageId, props.blockId]);
  useEffect(loadLinks, [props.config?.church]);

  //page editor only available for desktop
  useEffect(() => {
    if (windowWidth < 883) {
      redirect("/admin/site");
    }
  }, [windowWidth]);

  const handleDrop = (data: any, sort: number, zone: string) => {
    if (data.data) {
      const section: SectionInterface = data.data;
      section.sort = sort;
      section.zone = zone;
      section.pageId = (zone === "footer") ? null : props.pageId;
      ApiHelper.post("/sections", [section], "ContentApi").then(() => { loadData() });
    }
    else {
      const sec = { sort, background: "#FFF", textColor: "dark", pageId: props.pageId, blockId: props.blockId, targetBlockId: data.blockId, zone: zone }
      if (sec.zone === "footer") sec.pageId = null;
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
    const sections = (zone === "block") ? container?.sections : ArrayHelper.getAll(container?.sections, "zone", zone);
    sections?.forEach(section => {
      if (section.targetBlockId) result.push(<SectionBlock key={section.id} section={section} churchSettings={props.config.appearance} onEdit={handleSectionEdit} onMove={() => { loadData() }} />)
      else result.push(<Section key={section.id} section={section} churchSettings={props.config.appearance} onEdit={handleSectionEdit} onMove={() => { loadData() }} church={props.config?.church} />)
      result.push(getAddSection(section.sort + 0.1, zone));
    });

    if (sections.length === 0) {
      result.push(<Container><p>Add a section to get started</p></Container>)
    }
    return result;
  }

  const handleSectionEdit = (s: SectionInterface, e: ElementInterface) => {
    if (s) setEditSection(s);
    else if (e) setEditElement(e);
  }

  let rightBarStyle: CSSProperties = {}

  if (typeof window !== "undefined") {
    const editorBar = document.getElementById("editorBar");
    if (window.innerWidth > 900) {
      if (window?.innerHeight) {
        //const editorBarOffset = (editorBarHeight > window.innerHeight) ? (editorBarHeight - window.innerHeight) : 0;
        //const bottomMargin = editorBarOffset === 0 ? 0 : 50;
        //if (scrollTop >= 64 + editorBarOffset) rightBarStyle = { width: editorBar?.clientWidth, position: "fixed", marginTop: -64 - bottomMargin };
        if (scrollTop < 50) rightBarStyle = { paddingTop: 70 };
      }
      //if (editorBar && editorBar.clientHeight !== editorBarHeight && editorBar.clientHeight > 0) setEditorBarHeight(editorBar.clientHeight)
    }
  }

  const handleDone = () => {
    let url = '';
    if (props.pageId) {
      const page = container as PageInterface;
      if (page.layout === "embed") {
        if (page.url.includes("/member")) url = '/admin';
        else if (page.url.includes("/stream")) url = '/admin/video/settings';
      }
    }
    props.onDone(url);
  }

  /*Todo: affix the sidebar with CSS instead*/
  useEffect(() => {
    const onScroll = (e: any) => { setScrollTop(e.target.documentElement.scrollTop); };
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
    if (deviceType === "mobile") return createTheme({
      breakpoints: {
        values: { xs: 0, sm: 2000, md: 3000, lg: 4000, xl: 5000 },
      },
      components: {
        MuiTextField: { defaultProps: { margin: "normal" } },
        MuiFormControl: { defaultProps: { margin: "normal" } }
      }
    });
    else return createTheme({
      components: {
        MuiTextField: { defaultProps: { margin: "normal" } },
        MuiFormControl: { defaultProps: { margin: "normal" } }
      }
    });
  }

  //<div style={{ height: "31px" }}>{getAddSection(sections[sections.length - 1]?.sort + 0.1, keyName, "Drop at the bottom of page")}</div>
  const getZoneBox = (sections: SectionInterface[], name: string, keyName: string) => <div key={"zone-" + keyName} style={{ minHeight: 100 }}>
    <div style={{ position: "absolute", backgroundColor: "#FFF", zIndex: 100, padding: 10, border: "1px solid #999", opacity: 0.5 }}>Zone: {keyName}</div>
    <div style={{ minHeight: 100 }}>
      <>
        <div className="page" style={(deviceType === "mobile" ? { width: 400, marginLeft: "auto", marginRight: "auto" } : {})}>
          {getSections(keyName)}
        </div>
      </>
    </div>
    <div style={{ height: "31px" }}></div>
  </div>

  const getZoneBoxes = () => {
    let result: any[] = [];
    let idx = 0;
    if (props.pageId) {
      const page = container as PageInterface;
      if (page?.layout === "headerFooter") result.push(<Header config={props.config} overlayContent={page?.url === "/"} sections={[]} editMode />)
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

  const getHelp = () => (
    <Dialog open={true} onClose={() => { setShowHelp(false) }} fullWidth maxWidth="sm">
      <DisplayBox id="dialogForm" headerIcon="help" headerText="Help">
        <p>Use the plus icon in the corner to add new sections and elements to a page.  All elements must go within a section.</p>
        <p>Doubleclick any section or element to edit or remove it.</p>
        <p>Click and drag and section or element to rearrange content.</p>
      </DisplayBox>
    </Dialog>
  )



  return (<>
    <Theme config={props.config} />
    <Helmet><style>{StyleHelper.getCss(container?.sections || [], deviceType)}</style></Helmet>

    <div style={{ backgroundColor: "#FFF", position: "sticky", top: 0, width: "100%", zIndex: 1000, boxShadow: "0px 2px 2px black", marginBottom: 10 }}>
      <Grid container spacing={2}>
        <Grid item xs={4} style={{ paddingLeft: 40, paddingTop: 8 }}>
          <SmallButton icon={"done"} text="Done" onClick={handleDone} />
        </Grid>
        <Grid item xs={4} style={{ textAlign: "center" }}>
          <b>
            {props.pageId && "Page: " + (container as PageInterface)?.title}
            {props.blockId && "Block: " + (container as BlockInterface)?.name}
          </b>
        </Grid>
        <Grid item xs={4} style={{ textAlign: "right", paddingTop: 5, paddingBottom: 5, paddingRight: 15 }}>
          <div style={{ float: "right", display: "flex", backgroundColor: "#1976d2" }}>
            <ToggleButtonGroup value={showHelp.toString()} exclusive size="small">
              <ToggleButton value="true" onClick={() => setShowHelp(!showHelp)} style={{ borderRight: "1px solid #FFF", color: "#FFF" }}><Tooltip title="Help" placement="top"><Icon>help</Icon></Tooltip></ToggleButton>
            </ToggleButtonGroup>
            <ToggleButtonGroup value={showAdd.toString()} exclusive size="small">
              <ToggleButton value="true" onClick={() => setShowAdd(!showAdd)} style={{ borderRight: "1px solid #FFF", color: "#FFF" }}><Tooltip title="Add Content" placement="top"><Icon>add</Icon></Tooltip></ToggleButton>
            </ToggleButtonGroup>
            <ToggleButtonGroup size="small" value={deviceType} exclusive onChange={(e, newDeviceType) => { if (newDeviceType !== null) setDeviceType(newDeviceType) }}>
              {deviceType === "desktop" && <ToggleButton size="small" value="mobile" style={{ color: "#FFF" }}><Tooltip title="Desktop" placement="top"><Icon>computer</Icon></Tooltip></ToggleButton>}
              {deviceType === "mobile" && <ToggleButton size="small" value="desktop" style={{ color: "#FFF" }}><Tooltip title="Mobile" placement="top"><Icon>smartphone</Icon></Tooltip></ToggleButton>}
            </ToggleButtonGroup>
          </div>
        </Grid>
      </Grid>
    </div>



    <DndProvider backend={HTML5Backend}>
      {showHelp && getHelp()}
      {showAdd && <ElementAdd includeBlocks={!elementOnlyMode} includeSection={!elementOnlyMode} updateCallback={() => { setShowAdd(false); }} draggingCallback={() => setShowAdd(false)} />}
      {editElement && <ElementEdit element={editElement} updatedCallback={() => { setEditElement(null); loadData(); }} onRealtimeChange={handleRealtimeChange} globalStyles={props.config?.globalStyles} />}
      {editSection && <SectionEdit section={editSection} updatedCallback={() => { setEditSection(null); loadData(); }} globalStyles={props.config?.globalStyles} />}

      <div>
        {scrollTop > 150
          && <div style={{ position: "fixed", bottom: 30, zIndex: 1000, width: 500, marginLeft: 300 }}>
            <DroppableScroll key={"scrollDown"} text={"Scroll Down"} direction="down" />
          </div>}
        {scrollTop > 150 && <div style={{ position: "fixed", top: 50, zIndex: 1000, width: 500, marginLeft: 300 }}>
          <DroppableScroll key={"scrollUp"} text={"Scroll Up"} direction="up" />
        </div>}


        <h1 style={{ marginTop: -50 }}>Edit Page</h1>
        <ThemeProvider theme={getTheme()}>
          {getZoneBoxes()}
        </ThemeProvider>
      </div>
    </DndProvider>

  </>);
}
