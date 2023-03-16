import { useEffect, useState } from "react";
import { GetStaticPaths, GetStaticProps } from "next";
import router from "next/router";
import { ApiHelper, ConfigHelper, EnvironmentHelper, FileInterface, WrapperPageProps } from "@/helpers";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { FileUpload } from "@/components/admin/FileUpload";
import { Grid, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { DisplayBox, InputBox } from "@/components";
import { SmallButton } from "@/appBase/components";
import Link from "next/link";

export default function Files(props: WrapperPageProps) {
  const { isAuthenticated } = ApiHelper;
  const [pendingFileSave, setPendingFileSave] = useState(false);
  const [files, setFiles] = useState<FileInterface[]>(null);
  
  const handleFileSaved = (file: FileInterface) => {
    setPendingFileSave(false);
    loadData();
  };

  const handleSave = () => {
    setPendingFileSave(true);
  }

  const loadData = () => {
    ApiHelper.get("/files", "ContentApi").then(d => setFiles(d))
  }

  const handleDelete = async (file:FileInterface) => {
    if (confirm("Are you sure you wish to delete '" + file.fileName + "'?"))
    {
      await ApiHelper.delete("/files/" + file.id, "ContentApi");
      loadData();
    }
  }

  useEffect(() => { 
    if (!isAuthenticated) router.push("/login"); 
    else ApiHelper.get("/files", "ContentApi").then(d => setFiles(d));
  }, []);

  const fileRows = files?.map((file) => (
    <TableRow key={file.id}>
      <TableCell>
        <Link href={file.contentPath}>{file.fileName}</Link>
      </TableCell>
      <TableCell align="right">
        <SmallButton icon="delete" onClick={() => { handleDelete(file) }} />
      </TableCell>
    </TableRow>
  ));

  return (
    <AdminWrapper config={props.config}>
      <h1>Manage Your Files</h1>
      <Grid container spacing={3}>
        <Grid item md={8} xs={12}>
          <DisplayBox headerText="Files" headerIcon="description">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>{fileRows}</TableBody>
            </Table>
          </DisplayBox>
        </Grid>
        <Grid item md={4} xs={12}>
          <InputBox headerIcon="description" headerText="Upload" saveFunction={handleSave} saveText="Upload">
            <FileUpload pendingSave={pendingFileSave} saveCallback={handleFileSaved} />
          </InputBox>
        </Grid>
      </Grid>
      
      
      
    </AdminWrapper>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = [];
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const config = await ConfigHelper.load(params.sdSlug.toString());
  return { props: { config }, revalidate: 30 };
};
