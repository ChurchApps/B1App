import { useEffect, useState } from "react";
import { GetStaticPaths, GetStaticProps } from "next";
import router from "next/router";
import { ColorInterface, ConfigHelper, WrapperPageProps } from "@/helpers";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { Button, Grid, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { DisplayBox, ApiHelper, SmallButton } from "@churchapps/apphelper";
import { Appearance } from "@/components/admin/Appearance";
import { ColorEdit } from "@/components/admin/settings/ColorEdit";



export default function Colors(props: WrapperPageProps) {
  const { isAuthenticated } = ApiHelper;
  const [colors, setColors] = useState<ColorInterface[]>(null);
  const [color, setColor] = useState<ColorInterface>(null);

  const systemColors:ColorInterface[] = [
    { keyName: "primary", background: "#007bff", text: "#ffffff", link: "#ffffff", hover: "#108bff" },
    { keyName: "secondary", background: "#6c757d", text: "#ffffff", link: "#ffffff", hover: "#7c858d" },
    { keyName: "info", background: "#17a2b8", text: "#ffffff", link: "#ffffff", hover: "#138496" },
    { keyName: "success", background: "#28a745", text: "#ffffff", link: "#ffffff", hover: "#70db86" },
    { keyName: "warning", background: "#ffc107", text: "#212529", link: "#212529", hover: "#efb100" },
    { keyName: "danger", background: "#dc3545", text: "#ffffff", link: "#ffffff", hover: "#bb0000" },
    { keyName: "light", background: "#f8f9fa", text: "#212529", link: "#212529", hover: "#e2e6ea" },

  ]

  const loadData = () => {
    ApiHelper.get("/colors", "ContentApi").then(d => setColors(d));
  }

  const handleUpdate = () => {
    setColor(null);
    loadData();
  }

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
    else ApiHelper.get("/colors", "ContentApi").then(d => setColors(d));
  }, []);


  const editContent = (<SmallButton icon="add" onClick={() => { setColor( { keyName: "primary", background: "#007bff", text: "#ffffff", link: "#ffffff", hover: "#108bff" } ) }} /> );

  const getColorRow = (color:ColorInterface, canEdit:boolean) => (<TableRow key={color.id || color.keyName}>
    <TableCell>{canEdit ? color.keyName : color.keyName}</TableCell>
    <TableCell>
      <div style={{ backgroundColor: color.background, color:color.text, padding: 10, borderRadius:5 }}>
        Sample text area with <a href="#" style={{ color:color.link, textDecoration:"underline" }}>link</a>
      </div>
    </TableCell>
    <TableCell>
      <Button style={{ backgroundColor: color.background, color:color.text, padding: 10, borderRadius:5 }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor=color.hover }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor=color.background }}>
        Sample button
      </Button>
    </TableCell>
  </TableRow>)


  return (
    <AdminWrapper config={props.config}>
      <h1>Manage Your Colors</h1>
      <Grid container spacing={3}>
        <Grid item md={8} xs={12}>
          <DisplayBox headerText="Colors" headerIcon="description" editContent={editContent}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>{colors?.map((color) => getColorRow(color, true)) }</TableBody>
            </Table>
          </DisplayBox>

          <DisplayBox headerText="System Colors" headerIcon="palette">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>{systemColors?.map((color) => getColorRow(color, false)) }</TableBody>
            </Table>
          </DisplayBox>

        </Grid>
        <Grid item md={4} xs={12}>
          {color && <ColorEdit color={color} updatedFunction={handleUpdate} />}
          <Appearance />
        </Grid>
      </Grid>



    </AdminWrapper>
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
