import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Wrapper } from "@/components/Wrapper";
import { Grid } from "@mui/material";
import { ApiHelper, PageInterface, UserHelper } from "@/helpers";
import { DisplayBox } from "@/components";
import { Section } from "@/components/Section";

export default function Admin() {
  const router = useRouter();
  const [page, setPage] = useState<PageInterface>(null);

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

  const handleSectionEdit = () => {

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
          Edit Here
        </Grid>
      </Grid>
    </Wrapper>
  );
}
