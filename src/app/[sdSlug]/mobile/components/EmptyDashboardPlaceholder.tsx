"use client";

import React, { useContext, useMemo } from "react";
import { Button } from "@mui/material";
import { Locale, UserHelper } from "@churchapps/apphelper";
import { Permissions } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { EnvironmentHelper } from "@/helpers";
import { adminLoginUrl } from "@/helpers/adminUrl";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { PageHead, Plate, PlateSection, QuietEmpty } from "./kit";

interface Props {
  config: ConfigurationInterface;
  head?: React.ReactNode;
}

export const EmptyDashboardPlaceholder = ({ config, head }: Props) => {
  const context = useContext(UserContext);

  const canAccessAdmin = !!UserHelper.currentUserChurch
    && UserHelper.checkAccess(Permissions.contentApi.content.edit);

  const adminUrl = useMemo(() => {
    if (!canAccessAdmin || !context?.userChurch?.jwt || !context?.userChurch?.church?.id) return "";
    return adminLoginUrl(EnvironmentHelper.Common.B1AdminRoot, context.userChurch.church.id, context.userChurch.jwt, "/mobile/navigation");
  }, [canAccessAdmin, context?.userChurch?.jwt, context?.userChurch?.church?.id]);

  return (
    <>
      {head || <PageHead title={config?.church?.name || Locale.label("mobile.empty.dashboardTitleFallback")} />}
      <Plate>
        <PlateSection>
          <QuietEmpty>
            {canAccessAdmin ? Locale.label("mobile.empty.dashboardAdminBody") : Locale.label("mobile.empty.dashboardMemberBody")}
          </QuietEmpty>
          {canAccessAdmin && adminUrl && (
            <Button component="a" href={adminUrl} variant="contained" sx={{ mt: "14px" }}>
              {Locale.label("mobile.empty.dashboardAdminCta")}
            </Button>
          )}
        </PlateSection>
      </Plate>
    </>
  );
};
