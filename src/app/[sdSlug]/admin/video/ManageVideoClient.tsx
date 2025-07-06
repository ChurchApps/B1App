"use client";

import { useState } from "react";
import { WrapperPageProps } from "@/helpers";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { ImageEditor } from "@churchapps/apphelper/dist/components/ImageEditor";
import { UserHelper } from "@churchapps/apphelper/dist/helpers/UserHelper";
import { Permissions } from "@churchapps/helpers";
import { Banner } from "@churchapps/apphelper/dist/components/header/Banner";
import { Sermons } from "@/components/admin/video/Sermons";

export function ManageVideoClient(props: WrapperPageProps) {

  const [photoUrl, setPhotoUrl] = useState<string>(null);
  const [photoType, setPhotoType] = useState<string>(null);

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
    <AdminWrapper config={props.config}>
      <Banner><h1>Manage Sermons</h1></Banner>
      <div id="mainContent">
        {imageEditor}
        {UserHelper.checkAccess(Permissions.contentApi.streamingServices.edit) && (
          <Sermons showPhotoEditor={showPhotoEditor} updatedPhoto={(photoType === "sermon" && photoUrl) || null} />
        )}
      </div>
    </AdminWrapper>
  );
}
