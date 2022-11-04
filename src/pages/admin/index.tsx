import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Wrapper } from "@/components/Wrapper";
import { Grid, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { ApiHelper, PageInterface } from "@/helpers";
import { DisplayBox } from "@/components";
import { SmallButton } from "@/appBase/components";
import { PageEdit } from "@/components/admin/PageEdit";
import Link from "next/link";

export default function Admin() {
  const router = useRouter();
  const { isAuthenticated } = ApiHelper
  const [pages, setPages] = useState<PageInterface[]>([]);
  const [editPage, setEditPage] = useState<PageInterface>(null);


  useEffect(() => { if (isAuthenticated) { loadData(); } }, [isAuthenticated]);

  const loadData = () => {
    ApiHelper.get("/pages", "ContentApi").then(p => setPages(p));
  }

  const getRows = () => {
    let result: JSX.Element[] = []
    pages.forEach(p => {
      const page = p;
      result.push(<TableRow>
        <TableCell>
          <Link href={"/admin/pages/" + p.id}><a>{p.url}</a></Link>
        </TableCell>
        <TableCell>
          <Link href={"/admin/pages/" + p.id}><a>{p.title}</a></Link>
        </TableCell>
        <TableCell align="right"><SmallButton icon="edit" onClick={() => { setEditPage(page); }} /></TableCell>
      </TableRow>);
    });
    return result;
  }

  const getEditContent = (<SmallButton icon="add" onClick={() => { setEditPage({}) }} />);


  return (
    <Wrapper>
      <h1>Pages</h1>

      <Grid container spacing={3}>
        <Grid item md={8} xs={12}>
          <DisplayBox headerText="Pages" headerIcon="article" editContent={getEditContent}  >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Path</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getRows()}
              </TableBody>
            </Table>
          </DisplayBox>
        </Grid>
        <Grid item md={4} xs={12}>
          {(editPage) && <PageEdit page={editPage} updatedCallback={() => { setEditPage(null); loadData(); }} />}
        </Grid>
      </Grid>
    </Wrapper>
  );
}
