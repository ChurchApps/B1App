import React from "react";
import { Loading, AppearanceHelper } from "@churchapps/apphelper";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";

interface Props { config: ConfigurationInterface }

export const LoadingPage: React.FC<Props> = (props) => {
  const imgSrc = AppearanceHelper.getLogoLight(props.config?.appearance, "/images/logo.png")
  return (
    <div className="smallCenterBlock" style={{ marginTop: 100 }}>
      <img src={imgSrc} alt="logo" style={{ marginBottom: 50 }} />
      <Loading />
    </div>
  )
}


