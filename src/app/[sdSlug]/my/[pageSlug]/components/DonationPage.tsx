"use client";

import { useContext } from "react";
import UserContext from "@/context/UserContext";
import { BaseDonationPage } from "@/components/donate/BaseDonationPage";
import { UserHelper } from "@churchapps/apphelper/dist/helpers/UserHelper";
import { AppearanceHelper } from "@churchapps/apphelper/dist/helpers/AppearanceHelper";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";

interface Props {
  config: ConfigurationInterface
}

export function DonationsPage(props: Props) {
  const context = useContext(UserContext);

  const personId = context?.userChurch?.person?.id || UserHelper.currentUserChurch?.person?.id;

  return (<>
    <h1>My Donations</h1>
    <BaseDonationPage
      personId={personId}
      appName="B1App"
      church={props.config?.church}
      churchLogo={AppearanceHelper.getLogo(props.config?.appearance, "", "", "#FFF")}
    />
  </>);
}
