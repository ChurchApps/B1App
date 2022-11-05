import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Wrapper } from "@/components/Wrapper";
import { Grid } from "@mui/material";
import { ApiHelper, ElementInterface, PageInterface, SectionInterface, UserHelper } from "@/helpers";
import { DisplayBox } from "@/components";
import { Section } from "@/components/Section";
import { SectionEdit } from "@/components/admin/SectionEdit";
import { ElementEdit } from "@/components/admin/ElementEdit";

export default function Admin() {
  const router = useRouter();
  const [page, setPage] = useState<PageInterface>(null);
  const [editSection, setEditSection] = useState<SectionInterface>(null);
  const [editElement, setEditElement] = useState<ElementInterface>(null);

  const id = router.query.id;

  const loadData = () => {
    ApiHelper.get("/pages/" + UserHelper.currentChurch.id + "/tree?id=" + id, "ContentApi").then(p => setPage(p));
  }

  useEffect(loadData, [id]);

  const getSections = () => {
    const result: JSX.Element[] = []
    page?.sections.forEach(section => {
      result.push(<Section section={section} onEdit={handleSectionEdit} />)
    });
    return result;
  }

  const handleSectionEdit = (s: SectionInterface, e: ElementInterface) => {
    if (s) setEditSection(s);
    else if (e) setEditElement(e);
  }


  return (
    <Wrapper>
      <h1>Edit Page</h1>

      <Grid container spacing={3}>
        <Grid item md={8} xs={12}>
          <DisplayBox headerText="Page Preview" headerIcon="article"  >
            {getSections()}
          </DisplayBox>
        </Grid>
        <Grid item md={4} xs={12}>
          {editSection && <SectionEdit section={editSection} updatedCallback={() => { setEditSection(null); loadData(); }} />}
          {editElement && <ElementEdit element={editElement} updatedCallback={() => { setEditElement(null); loadData(); }} />}
        </Grid>
      </Grid>
    </Wrapper>
  );
}
