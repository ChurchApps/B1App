import { useEffect, useState } from "react";
import { GetStaticPaths, GetStaticProps } from "next";
import router from "next/router";
import { BlockInterface, ConfigHelper, WrapperPageProps } from "@/helpers";
import { ApiHelper, DisplayBox, ErrorMessages, SmallButton } from "@churchapps/apphelper";
import { Grid, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { useWindowWidth } from "@react-hook/window-size";
import { AdminSiteWrapper } from "@/components/admin/AdminSiteWrapper";
import { BlockEdit } from "@/components/admin/BlockEdit";
import Link from "next/link";

export default function Admin(props: WrapperPageProps) {
  const { isAuthenticated } = ApiHelper;
  const [blocks, setBlocks] = useState<BlockInterface[]>([]);
  const [editBlock, setEditBlock] = useState<BlockInterface>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const windowWidth = useWindowWidth();

  const loadData = () => {
    if (!isAuthenticated) return;

    ApiHelper.get("/blocks", "ContentApi").then((b) => setBlocks(b || []));
  };

  const editBlockContent = (
    <SmallButton
      icon="add"
      onClick={() => {
        setEditBlock({ blockType: "elementBlock" });
      }}
    />
  );

  const blocksUi = blocks.map((block) => (
    <TableRow key={block.id}>
      <TableCell>
        <Link href={"/admin/site/blocks/" + block.id} style={{cursor: "pointer"}}>{block.name}</Link>
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

  useEffect(() => { if (!isAuthenticated) router.push("/login"); }, []);
  useEffect(loadData, [isAuthenticated]);


  //<YourSiteSettings />
  if (windowWidth < 882){
    return <ErrorMessages errors={["Page editor is only available in desktop mode"]} />;
  }
  return (
    <AdminSiteWrapper config={props.config}>
      <ErrorMessages errors={errors} />
      <Grid container spacing={3}>
        <Grid item md={8} xs={12}>
          <DisplayBox headerText="Pages" headerIcon="article">
            <p>Use the left navigation to edit pages and links.</p>
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
          {editBlock && (<BlockEdit block={editBlock}
            updatedCallback={() => {
              setEditBlock(null);
              loadData();
            }}
          />
          )}
        </Grid>
      </Grid>

    </AdminSiteWrapper>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths:any[] = [];
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const config = await ConfigHelper.load(params.sdSlug.toString());
  return { props: { config }, revalidate: 30 };
};
