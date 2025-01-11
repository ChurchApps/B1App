"use client";

import { useContext } from "react";
import UserContext from "@/context/UserContext";
import { BaseDonationPage } from "@/components/donate/BaseDonationPage";
import { UserHelper, AppearanceHelper } from "@churchapps/apphelper";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";

interface Props {
  config: ConfigurationInterface
}

export function DonationsPage(props: Props) {
  const context = useContext(UserContext);

  return (<>
    <h1>My Donations</h1>
    <BaseDonationPage
      personId={UserHelper.currentUserChurch?.person?.id}
      appName="B1App"
      church={props.config?.church}
      churchLogo={AppearanceHelper.getLogo( props.config?.appearance, "", "", "#FFF")}
    />
  </>);
}
