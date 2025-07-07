"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Banner } from "@churchapps/apphelper/dist/components/header/Banner";
import { ImageEditor } from "@churchapps/apphelper/dist/components/ImageEditor";
import { Permissions } from "@churchapps/helpers";
import { UserHelper } from "@churchapps/apphelper/dist/helpers/UserHelper";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { ConfigHelper, ConfigurationInterface } from "@/helpers/ConfigHelper";
import { Playlists } from "@/components/admin/video/Playlists";

type PageParams = {sdSlug:string }

export default function AdminPagesClient() {
  const [config, setConfig] = useState<ConfigurationInterface>(null);
  const [photoType, setPhotoType] = useState<string>(null);
  const [photoUrl, setPhotoUrl] = useState<string>(null);
  const params = useParams<PageParams>()

  const loadData = () => {
    ConfigHelper.load(params.sdSlug).then((data) => { setConfig(data); });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePhotoUpdated = (dataUrl: string) => {
    setPhotoUrl(dataUrl);
    setPhotoType(photoType);
  };

  const imageEditor = (photoUrl || photoUrl === "") && (
    <ImageEditor
      aspectRatio={16 / 9}
      photoUrl={photoUrl}
      onCancel={() => { setPhotoUrl(null); setPhotoType(null) }}
      onUpdate={handlePhotoUpdated}
      outputWidth={640}
      outputHeight={360}
    />
  );


  const showPhotoEditor = (pType: string, url: string) => {
    setPhotoUrl(url);
    setPhotoType(pType);
  };



  return (
    <AdminWrapper config={config}>
      <Banner><h1>Edit Playlists</h1></Banner>
      <div id="mainContent">
        {imageEditor}
        {UserHelper.checkAccess(Permissions.contentApi.streamingServices.edit) && (
          <Playlists showPhotoEditor={showPhotoEditor} updatedPhoto={(photoType === "playlist" && photoUrl) || null} />
        )}
      </div>
    </AdminWrapper>
  );
}
