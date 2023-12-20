import { CSSProperties, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Grid } from "@mui/material";
import { useWindowWidth } from "@react-hook/window-size";
import { ElementInterface, BlockInterface, SectionInterface, ConfigHelper, WrapperPageProps, GlobalStyleInterface } from "@/helpers";
import { Theme } from "@/components";
import { DisplayBox, UserHelper, ChurchInterface, ApiHelper } from "@churchapps/apphelper";
import { Section } from "@/components/Section";
import { SectionEdit } from "@/components/admin/SectionEdit";
import { ElementEdit } from "@/components/admin/ElementEdit";
import { ElementAdd } from "@/components/admin/ElementAdd";
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import React from "react";
import { DroppableArea } from "@/components/admin/DroppableArea";
import { GetStaticPaths, GetStaticProps } from "next";
import { AdminWrapper } from "@/components/admin/AdminWrapper";

interface Props extends WrapperPageProps {
  church: ChurchInterface,
  churchSettings: any,
  globalStyles: GlobalStyleInterface
};

export default function Admin(props: Props) {
  const { isAuthenticated } = ApiHelper
  const router = useRouter();
  const [block, setBlock] = useState<BlockInterface>(null);
  const [editSection, setEditSection] = useState<SectionInterface>(null);
  const [editElement, setEditElement] = useState<ElementInterface>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const id = router.query.id?.toString() || "";
  const windowWidth = useWindowWidth();

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); }
  }, []);

  const loadData = () => {
    if (isAuthenticated) ApiHelper.get("/blocks/" + UserHelper.currentUserChurch.church.id + "/tree/" + id, "ContentApi").then(p => setBlock(p));
  }

  useEffect(loadData, [id]);

  //block editor only available for desktop
  useEffect(() => {
    if (windowWidth < 883){
      router.push("/admin/site");
    }
  }, [windowWidth]);

  const handleDrop = (data: any, sort: number) => {
    if (data.data) {
      const section: SectionInterface = data.data;
      section.sort = sort;
      section.zone = "main";
      ApiHelper.post("/sections", [section], "ContentApi").then(() => { loadData() });
    }
    else setEditSection({ sort, background: "#FFF", textColor: "light", blockId: id });
  }

  const getAddSection = (s: number) => {
    const sort = s;
    return (<DroppableArea accept="section" onDrop={(data) => handleDrop(data, sort)} />);
    //return (<div style={{ textAlign: "center", background: "#EEE" }}><SmallButton icon="add" onClick={() => setEditSection({ sort, background: "#FFF", textColor: "light" })} toolTip="Add Section" /></div>)
  }

  const getSections = () => {
    const result: JSX.Element[] = []
    result.push(getAddSection(0));
    block?.sections.forEach(section => {
      result.push(<Section key={section.id} section={section} onEdit={handleSectionEdit} onMove={() => { loadData() }} churchSettings={props.config} />)
      result.push(getAddSection(section.sort + 0.1));
    });
    return result;
  }

  const handleSectionEdit = (s: SectionInterface, e: ElementInterface) => {
    if (s) setEditSection(s);
    else if (e) setEditElement(e);
  }

  let rightBarStyle: CSSProperties = {};

  if(typeof window !== "undefined"){
    if(window.innerWidth > 900){
      rightBarStyle = (scrollTop < 180)
        ? {}
        : {
          width: document.getElementById("editorBar")?.clientWidth,
          position: "fixed",
          marginTop: -180
        };
    }
  }

  useEffect(() => {
    const onScroll = (e:any) => {
      setScrollTop(e.target.documentElement.scrollTop);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollTop]);

  const handleRealtimeChange = (element: ElementInterface) => {
    const p = { ...block };
    p.sections.forEach(s => {
      realtimeUpdateElement(element, s.elements);
    })
    setBlock(p);
  }

  const realtimeUpdateElement = (element: ElementInterface, elements: ElementInterface[]) => {
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].id === element.id) elements[i] = element;
      if (element.elements?.length > 0) realtimeUpdateElement(element, element.elements);
    }
  }


  return (
    <AdminWrapper config={props.config}>
      <Theme appearance={props.churchSettings} globalStyles={props.globalStyles} />
      <h1>Edit Block</h1>
      <DndProvider backend={HTML5Backend}>
        <Grid container spacing={3}>
          <Grid item md={8} xs={12}>
            <DisplayBox headerText="Block Preview" headerIcon="article">
              <div id="block" style={{ height: 500, overflowY: "scroll" }}>
                <div className="page">
                  {getSections()}
                </div>
              </div>
            </DisplayBox>
          </Grid>
          <Grid item md={4} xs={12}>
            <div id="editorBar">
              <div style={rightBarStyle}>
                {!editSection && !editElement && <ElementAdd includeBlocks={false} includeSection={block?.blockType === "sectionBlock"} />}
                {editSection && <SectionEdit section={editSection} updatedCallback={() => { setEditSection(null); loadData(); }} globalStyles={props.globalStyles} />}
                {editElement && <ElementEdit element={editElement} updatedCallback={() => { setEditElement(null); loadData(); }} onRealtimeChange={handleRealtimeChange} />}
              </div>
            </div>
          </Grid>
        </Grid>
      </DndProvider>
    </AdminWrapper>
  );
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
