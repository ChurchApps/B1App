"use client"
import { useState, useEffect } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Grid, Table, TableBody, TableCell, TableHead, TableRow, Icon, Button } from "@mui/material";
import { useWindowWidth } from "@react-hook/window-size";
import { DisplayBox } from "@churchapps/apphelper/dist/components/DisplayBox";
import { ErrorMessages } from "@churchapps/apphelper/dist/components/ErrorMessages";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import { UserHelper } from "@churchapps/apphelper/dist/helpers/UserHelper";
import { Permissions } from "@churchapps/helpers";
import { Links } from "@/components/admin/Links";
import { BlockEdit } from "@/components/admin/BlockEdit";
import { SmallButton } from "@churchapps/apphelper/dist/components/SmallButton";
import { BlockInterface, PageInterface } from "@/helpers";
import { TemplateHelper } from "@/helpers/TemplateHelper";

export function YourSiteSettings() {
  const { isAuthenticated } = ApiHelper;
  const [errors, setErrors] = useState<string[]>([]);
  const [pages, setPages] = useState<PageInterface[]>([]);
  const [blocks, setBlocks] = useState<BlockInterface[]>([]);
  const [editPage, setEditPage] = useState<PageInterface>(null);
  const [editBlock, setEditBlock] = useState<BlockInterface>(null);
  const [refresh, refresher] = useState({});
  const [creatingPages, setCreatingPages] = useState<boolean>(false);
  const windowWidth = useWindowWidth();

  // redirect to login when not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      redirect("/login");
    }
  }, [isAuthenticated]);

  const loadData = () => {
    if (!isAuthenticated) {
      return;
    }

    ApiHelper.get("/pages", "ContentApi").then((_pages) => {
      let filteredPages:PageInterface[] = [];
      _pages.forEach((p:PageInterface) => {
        if (!p.url.startsWith("/stream/") && !p.url.startsWith("/member/")) filteredPages.push(p);
      });
      setPages(filteredPages || [])
    });
    ApiHelper.get("/blocks", "ContentApi").then((b) => setBlocks(b || []));
  };

  useEffect(loadData, [isAuthenticated]);

  const editContent = (
    <>
      {pages.length === 0
        && (<Button variant="outlined" size="small" sx={{ marginRight: 2 }}
          onClick={async () => {
            setCreatingPages(true);
            await TemplateHelper.createDefaultLinks();
            await TemplateHelper.createDefaultFooter();
            await TemplateHelper.createDefaultPages();
            loadData();
            refresher({});
            setCreatingPages(false);
          }}
        >
          {creatingPages === true ? 'Creating...' : 'Create Default Pages'}
        </Button>)
      }
      <SmallButton icon="add" onClick={() => { setEditPage({}); }} />
    </>
  );

  const editBlockContent = (
    <SmallButton
      icon="add"
      onClick={() => {
        setEditBlock({ blockType: "elementBlock" });
      }}
    />
  );

  const navigationHandler = (errorMessage: string, url: string) => {
    let errors: string[] = [];

    if (windowWidth > 882){
      redirect(url);
    } else {
      errors.push(errorMessage);
    }

    if (errors.length > 0) {
      setErrors(errors);
      return;
    }
  }


  const pagesUi = pages.map((page) => {

    const clickHandler = () => navigationHandler("Page editor is only accessible on desktop", "/admin/site/pages/" + page.id);

    return (
      <TableRow key={page.id}>
        <TableCell>
          <a onClick={clickHandler} style={{cursor: "pointer"}}>{page.url}</a>
        </TableCell>
        <TableCell>
          <a onClick={clickHandler} style={{cursor: "pointer"}}>{page.title}</a>
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
    )
  });

  const blocksUi = blocks.map((block) => {

    const clickHandler = () => navigationHandler("Block editor is only accessible on desktop", "/admin/site/blocks/" + block.id)

    return (
      <TableRow key={block.id}>
        <TableCell>
          <a onClick={clickHandler} style={{cursor: "pointer"}}>{block.name}</a>
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
    )
  });

  return (
    <Grid container spacing={3}>
      <ErrorMessages errors={errors} />
      {UserHelper.checkAccess(Permissions.contentApi.content.edit)
        && <Grid size={{ md: 8, xs: 12 }}>
          <DisplayBox headerText="Pages" headerIcon="article" editContent={editContent} data-testid="site-pages-display-box">
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
          <DisplayBox headerText="Reusable Blocks" headerIcon="smart_button" editContent={editBlockContent} data-testid="site-reusable-blocks-display-box">
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
      }
      <Grid size={{ md: 4, xs: 12 }}>

        {editBlock && (<BlockEdit block={editBlock}
          updatedCallback={() => {
            setEditBlock(null);
            loadData();
          }}
        />
        )}
        {UserHelper.checkAccess(Permissions.contentApi.content.edit) && <Links refresh={refresh} />}

        <DisplayBox headerIcon="link" headerText="Additional Resources" editContent={false} help="b1/streaming/appearance" data-testid="additional-resources-display-box">
          <table className="table">
            <tbody>
              <tr>
                <td>
                  <Link href={"/admin/site/styles"} style={{ display: "flex" }}>
                    <Icon sx={{ marginRight: "5px" }}>palette</Icon>Manage Appearance
                  </Link>
                </td>
              </tr>
              <tr>
                <td>
                  <Link href={"/admin/site/files"} style={{ display: "flex" }}>
                    <Icon sx={{ marginRight: "5px" }}>description</Icon>Manage Files
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </DisplayBox>
      </Grid>
    </Grid>
  );
}
