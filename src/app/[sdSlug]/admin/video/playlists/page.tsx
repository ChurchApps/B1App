"use client";

import { useEffect, useState } from "react";
import { redirect, useParams } from "next/navigation";
import { ApiHelper, Banner, Permissions, UserHelper } from "@churchapps/apphelper";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { ConfigHelper, ConfigurationInterface } from "@/helpers/ConfigHelper";
import { Playlists } from "@/components/admin/video/Playlists";

type PageParams = {sdSlug:string }

export default function AdminPagesClient() {
  const { isAuthenticated } = ApiHelper;
  const [config, setConfig] = useState<ConfigurationInterface>(null);
  const [photoType, setPhotoType] = useState<string>(null);
  const [photoUrl, setPhotoUrl] = useState<string>(null);
  const params = useParams<PageParams>()

  const loadData = () => {
    ConfigHelper.load(params.sdSlug).then((data) => { setConfig(data); });
  };

  useEffect(() => {
    if (!isAuthenticated) redirect("/login");
    else loadData();
  }, [isAuthenticated]);


  const showPhotoEditor = (pType: string, url: string) => {
    setPhotoUrl(url);
    setPhotoType(pType);
  };



  return (
    <AdminWrapper config={config}>
      <Banner><h1>Edit Playlists</h1></Banner>
      <div id="mainContent">
        {UserHelper.checkAccess(Permissions.contentApi.streamingServices.edit) && (
          <Playlists showPhotoEditor={showPhotoEditor} updatedPhoto={(photoType === "playlist" && photoUrl) || null} />
        )}
      </div>
    </AdminWrapper>
  );
}
