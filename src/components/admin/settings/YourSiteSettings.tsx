import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Grid, Table, TableBody, TableCell, TableHead, TableRow, Icon } from "@mui/material";
import { DisplayBox } from "@/components";
import { Links } from "@/components/admin/Links";
import { PageEdit } from "@/components/admin/PageEdit";
import { BlockEdit } from "@/components/admin/BlockEdit";
import { SmallButton } from "@/appBase/components";
import { BlockInterface, PageInterface, UserHelper, ApiHelper, EnvironmentHelper } from "@/helpers";
import { Permissions } from "@/appBase/interfaces";

export function YourSiteSettings() {
  const { isAuthenticated } = ApiHelper;
  const [pages, setPages] = useState<PageInterface[]>([]);
  const [blocks, setBlocks] = useState<BlockInterface[]>([]);
  const [editPage, setEditPage] = useState<PageInterface>(null);
  const [editBlock, setEditBlock] = useState<BlockInterface>(null);
  const router = useRouter();

  // redirect to login when not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated]);

  const loadData = () => {
    if (!isAuthenticated) {
      return;
    }

    ApiHelper.get("/pages", "ContentApi").then((_pages) => { 
      let filteredPages = [];
      _pages.forEach(p => { 
        if (!p.url.startsWith("/stream/") && !p.url.startsWith("/member/")) filteredPages.push(p); 
      });
      setPages(filteredPages || []) 
    });
    ApiHelper.get("/blocks", "ContentApi").then((b) => setBlocks(b || []));
  };

  useEffect(loadData, [isAuthenticated]);

  const editContent = (
    <SmallButton
      icon="add"
      onClick={() => {
        setEditPage({});
      }}
    />
  );

  const editBlockContent = (
    <SmallButton
      icon="add"
      onClick={() => {
        setEditBlock({ blockType: "elementBlock" });
      }}
    />
  );

  let churchSettings = null;
  if (UserHelper.checkAccess(Permissions.membershipApi.settings.edit)) {
    const jwt = ApiHelper.getConfig("MembershipApi")?.jwt;
    const url = `${EnvironmentHelper.Common.ChumsRoot}/login?jwt=${jwt}&returnUrl=/${UserHelper.currentUserChurch?.church?.id}/manage`;
    churchSettings = (
      <tr>
        <td>
          <a href={url} style={{ display: "flex" }}>
            <Icon sx={{ marginRight: "5px" }}>edit</Icon>Customize Appearance
          </a>
        </td>
      </tr>
    );
  }

  const pagesUi = pages.map((page) => (
    <TableRow key={page.id}>
      <TableCell>
        <Link href={"/admin/site/pages/" + page.id}>{page.url}</Link>
      </TableCell>
      <TableCell>
        <Link href={"/admin/site/pages/" + page.id}>{page.title}</Link>
      </TableCell>
      <TableCell align="right">
        <SmallButton
          icon="edit"
          onClick={() => {
            setEditPage(page);
          }}
        />
      </TableCell>
    </TableRow>
  ));

  const blocksUi = blocks.map((block) => (
    <TableRow key={block.id}>
      <TableCell>
        <Link href={"/admin/site/blocks/" + block.id}>{block.name}</Link>
      </TableCell>
      <TableCell>{block.blockType === "elementBlock" ? "Element(s)" : "Section(s)"}</TableCell>
      <TableCell align="right">
        <SmallButton
          icon="edit"
          onClick={() => {
            setEditBlock(block);
          }}
        />
      </TableCell>
    </TableRow>
  ));

  return (
    <Grid container spacing={3}>
      <Grid item md={8} xs={12}>
        <DisplayBox headerText="Pages" headerIcon="article" editContent={editContent}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Path</TableCell>
                <TableCell>Title</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{pagesUi}</TableBody>
          </Table>
        </DisplayBox>
        <DisplayBox headerText="Reusable Blocks" headerIcon="smart_button" editContent={editBlockContent}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{blocksUi}</TableBody>
          </Table>
        </DisplayBox>
      </Grid>
      <Grid item md={4} xs={12}>
        {editPage && (
          <PageEdit
            page={editPage}
            updatedCallback={() => {
              setEditPage(null);
              loadData();
            }}
          />
        )}
        {editBlock && (
          <BlockEdit
            block={editBlock}
            updatedCallback={() => {
              setEditBlock(null);
              loadData();
            }}
          />
        )}
        <Links />
        <DisplayBox headerIcon="link" headerText="External Resources" editContent={false} help="accounts/appearance">
          <table className="table">
            <tbody>
              <tr>
                <td>
                  <Link href={"/admin/site/files"} style={{ display: "flex" }}>
                    <Icon sx={{ marginRight: "5px" }}>description</Icon>Manage Files
                  </Link>
                </td>
              </tr>
              {churchSettings}
            </tbody>
          </table>
        </DisplayBox>
      </Grid>
    </Grid>
  );
}
