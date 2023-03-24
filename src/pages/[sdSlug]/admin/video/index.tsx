import { useEffect, useState } from "react";
import { GetStaticPaths, GetStaticProps } from "next";
import router from "next/router";
import { ApiHelper, ConfigHelper, WrapperPageProps } from "@/helpers";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { Icon, Grid } from "@mui/material";
import { DisplayBox, ImageEditor } from "@/appBase/components";
import { Sermons } from "@/components/admin/video/Sermons";
import { Playlists } from "@/components/admin/video/Playlists";
import Link from "next/link";
import { Import } from "@/components/admin/video/Import";

export default function Admin(props: WrapperPageProps) {
  const { isAuthenticated } = ApiHelper;

  useEffect(() => { if (!isAuthenticated) router.push("/login"); }, []);

  const [photoUrl, setPhotoUrl] = useState<string>(null);
  const [photoType, setPhotoType] = useState<string>(null);
  const [importMode, setImportMode] = useState(false);

  const handlePhotoUpdated = (dataUrl: string) => {
    setPhotoUrl(dataUrl);
  };

  const imageEditor = photoType && <ImageEditor aspectRatio={16 / 9} photoUrl={photoUrl} onCancel={() => setPhotoUrl(null)} onUpdate={handlePhotoUpdated} outputWidth={640} outputHeight={360} />;

  const showPhotoEditor = (pType: string, url: string) => {
    setPhotoUrl(url);
    setPhotoType(pType);
  };

  return (
    <AdminWrapper config={props.config}>
      <h1>
        <Icon>live_tv</Icon> Manage Sermons
      </h1>
      <Grid container spacing={3}>
        <Grid item md={8} xs={12}>
          {(importMode) 
            ? <Import handleDone={() => { setImportMode(false); }} />
            : <Sermons showPhotoEditor={showPhotoEditor} updatedPhoto={(photoType === "sermon" && photoUrl) || null} />
          }
        </Grid>
        <Grid item md={4} xs={12}>
          {imageEditor}
          <DisplayBox headerIcon="settings" headerText="Settings">
            <div><Link href="/admin/video/settings">Edit Times and Appearance</Link></div>
            { (!importMode) && <div><a href="about:blank" onClick={(e) => { e.preventDefault(); setImportMode(true); }}>Bulk Import from Youtube</a></div> }
          </DisplayBox>
          <Playlists showPhotoEditor={showPhotoEditor} updatedPhoto={(photoType === "playlist" && photoUrl) || null} />
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
