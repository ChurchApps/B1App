"use client";

import React, { useContext, useState, useEffect, Suspense } from "react";
import UserContext from "@/context/UserContext";
import { ApiHelper, UserHelper, AppearanceHelper } from "@churchapps/apphelper";
import type { DonationInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { DonationsMasterPanel } from "./DonationsMasterPanel";
import { DonationsDetailPanel } from "./DonationsDetailPanel";

interface Props {
  config: ConfigurationInterface;
}

function DonationsPageInner({ config }: Props) {
  const context = useContext(UserContext);
  const personId = context?.userChurch?.person?.id || UserHelper.currentUserChurch?.person?.id;
  const [donations, setDonations] = useState<DonationInterface[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDonations = () => {
    setIsLoading(true);
    ApiHelper.get("/donations/my", "GivingApi").then((data: DonationInterface[]) => {
      setDonations(data);
      setIsLoading(false);
    });
  };

  useEffect(() => { loadDonations(); }, [personId]);

  return (
    <div className="masterDetail" data-has-selection="false">
      <div className="masterPanel">
        <DonationsMasterPanel donations={donations} isLoading={isLoading} />
      </div>
      <div className="detailPanel">
        <DonationsDetailPanel
          personId={personId}
          church={config?.church}
          churchLogo={AppearanceHelper.getLogo(config?.appearance, "", "", "#FFF")}
          onDataUpdate={loadDonations}
        />
      </div>
    </div>
  );
}

export function DonationsPage(props: Props) {
  return (
    <Suspense>
      <DonationsPageInner {...props} />
    </Suspense>
  );
}
