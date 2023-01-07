import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Wrapper } from "@/components/Wrapper";
import { Grid, Icon, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { ApiHelper, BlockInterface, EnvironmentHelper, PageInterface, UserHelper } from "@/helpers";
import { DisplayBox } from "@/components";
import { SmallButton } from "@/appBase/components";
import { PageEdit } from "@/components/admin/PageEdit";
import Link from "next/link";
import { Links } from "@/components/admin/Links";
import { Permissions } from "@/appBase/interfaces"
import { BlockEdit } from "@/components/admin/BlockEdit";

export default function Admin() {
  const router = useRouter();
  const { isAuthenticated } = ApiHelper
  const [pages, setPages] = useState<PageInterface[]>([]);
  const [editPage, setEditPage] = useState<PageInterface>(null);
  const [blocks, setBlocks] = useState<BlockInterface[]>([]);
  const [editBlock, setEditBlock] = useState<BlockInterface>(null);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); }
  }, []);

  useEffect(() => { if (isAuthenticated) { loadData(); } }, [isAuthenticated]);

  const loadData = () => {
    ApiHelper.get("/pages", "ContentApi").then(p => setPages(p));
    ApiHelper.get("/blocks", "ContentApi").then(b => setBlocks(b));
  }

  const getRows = () => {
    let result: JSX.Element[] = []
    pages.forEach(p => {
      const page = p;
      result.push(<TableRow>
        <TableCell>
          <Link href={"/admin/pages/" + p.id}>{p.url}</Link>
        </TableCell>
        <TableCell>
          <Link href={"/admin/pages/" + p.id}>{p.title}</Link>
        </TableCell>
        <TableCell align="right"><SmallButton icon="edit" onClick={() => { setEditPage(page); }} /></TableCell>
      </TableRow>);
    });
    return result;
  }

  const getBlocks = () => {
    let result: JSX.Element[] = []
    blocks.forEach(b => {
      const block = b;
      result.push(<TableRow>
        <TableCell>
          <Link href={"/admin/blocks/" + b.id}>{b.name}</Link>
        </TableCell>
        <TableCell>
          {(b.blockType === "elements") ? "Element(s)" : "Section(s)"}
        </TableCell>
        <TableCell align="right"><SmallButton icon="edit" onClick={() => { setEditBlock(block); }} /></TableCell>
      </TableRow>);
    });
    return result;
  }

  const getEditContent = (<SmallButton icon="add" onClick={() => { setEditPage({}) }} />);
  const getEditBlockContent = (<SmallButton icon="add" onClick={() => { setEditBlock({ blockType: "elements" }) }} />);

  const getChurchEditSetting = () => {
    if (Permissions.membershipApi.settings.edit) {
      const jwt = ApiHelper.getConfig("MembershipApi").jwt;
      const url = `${EnvironmentHelper.Common.ChumsRoot}/login?jwt=${jwt}&returnUrl=/${UserHelper.currentUserChurch?.church?.id}/manage`;
      return (<tr><td><a href={url} style={{ display: "flex" }}><Icon sx={{ marginRight: "5px" }}>edit</Icon>Customize Appearance</a></td></tr>);
    }
    else return null;
  }

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
          <DisplayBox headerText="Reusable Blocks" headerIcon="smart_button" editContent={getEditBlockContent}  >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getBlocks()}
              </TableBody>
            </Table>
          </DisplayBox>
        </Grid>
        <Grid item md={4} xs={12}>
          {(editPage) && <PageEdit page={editPage} updatedCallback={() => { setEditPage(null); loadData(); }} />}
          {(editBlock) && <BlockEdit block={editBlock} updatedCallback={() => { setEditBlock(null); loadData(); }} />}
          <Links />
          <DisplayBox headerIcon="link" headerText="External Resources" editContent={false} help="accounts/appearance">
            <table className="table">
              <tbody>
                {getChurchEditSetting()}
              </tbody>
            </table>
          </DisplayBox>
        </Grid>
      </Grid>
    </Wrapper>
  );
}
