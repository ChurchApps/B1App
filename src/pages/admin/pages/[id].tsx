import { CSSProperties, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Wrapper } from "@/components/Wrapper";
import { Grid } from "@mui/material";
import { ApiHelper, ElementInterface, PageInterface, SectionInterface, UserHelper } from "@/helpers";
import { DisplayBox } from "@/components";
import { Section } from "@/components/Section";
import { SectionEdit } from "@/components/admin/SectionEdit";
import { ElementEdit } from "@/components/admin/ElementEdit";
import { ElementAdd } from "@/components/admin/ElementAdd";
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import React from "react";
import { DroppableArea } from "@/components/admin/DroppableArea";

export default function Admin() {

  const router = useRouter();
  const [page, setPage] = useState<PageInterface>(null);
  const [editSection, setEditSection] = useState<SectionInterface>(null);
  const [editElement, setEditElement] = useState<ElementInterface>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const id = router.query.id.toString();

  const loadData = () => {
    ApiHelper.get("/pages/" + UserHelper.currentChurch.id + "/tree?id=" + id, "ContentApi").then(p => setPage(p));
  }

  useEffect(loadData, [id]);

  const getAddSection = (sort: number) => {
    return (<DroppableArea accept="section" onDrop={(data) => setEditSection({ sort, background: "#FFF", textColor: "light", pageId: id })} />);
    //return (<div style={{ textAlign: "center", background: "#EEE" }}><SmallButton icon="add" onClick={() => setEditSection({ sort, background: "#FFF", textColor: "light" })} toolTip="Add Section" /></div>)
  }

  const getSections = () => {
    const result: JSX.Element[] = []
    result.push(getAddSection(0));
    page?.sections.forEach(section => {
      result.push(<Section section={section} onEdit={handleSectionEdit} />)
      result.push(getAddSection(section.sort + 1));
    });
    return result;
  }

  const handleSectionEdit = (s: SectionInterface, e: ElementInterface) => {
    if (s) setEditSection(s);
    else if (e) setEditElement(e);
  }

  const rightBarStyle: CSSProperties = (scrollTop < 180) ? {} : {
    width: document.getElementById("editorBar")?.clientWidth,
    position: "fixed",
    marginTop: -180
  };

  useEffect(() => {
    const onScroll = e => {
      setScrollTop(e.target.documentElement.scrollTop);
    };
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
      if (element.elements?.length > 0) realtimeUpdateElement(element, element.elements);
    }
  }


  return (
    <Wrapper>
      <h1>Edit Page</h1>
      <DndProvider backend={HTML5Backend}>
        <Grid container spacing={3}>
          <Grid item md={8} xs={12}>
            <DisplayBox headerText="Page Preview" headerIcon="article"  >
              <div id="page" style={{ height: 500, overflowY: "scroll" }}>
                {getSections()}
              </div>
            </DisplayBox>
          </Grid>
          <Grid item md={4} xs={12}>
            <div id="editorBar">
              <div style={rightBarStyle}>
                {!editSection && !editElement && <ElementAdd />}
                {editSection && <SectionEdit section={editSection} updatedCallback={() => { setEditSection(null); loadData(); }} />}
                {editElement && <ElementEdit element={editElement} updatedCallback={() => { setEditElement(null); loadData(); }} onRealtimeChange={handleRealtimeChange} />}
              </div>
            </div>
          </Grid>
        </Grid>
      </DndProvider>
    </Wrapper>
  );
}
