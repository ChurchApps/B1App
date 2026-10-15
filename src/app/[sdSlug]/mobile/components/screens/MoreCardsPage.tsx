"use client";

import React, { useContext, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Avatar, Box, Button, Icon, Typography } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { type LinkInterface, Permissions } from "@churchapps/helpers";
import { Locale, PersonHelper, UserHelper } from "@churchapps/apphelper";
import UserContext from "@/context/UserContext";
import { EnvironmentHelper } from "@/helpers";
import { WebPushHelperBase } from "@/helpers/WebPushHelperBase";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme, linkTypeToIcon } from "../mobileTheme";
import { getInitials } from "../util";
import { useMobileThemeMode, type MobileThemeMode } from "../MobileThemeProvider";
import { PageHead, Plate, PlateSection, Row, RowList, TextLink, ViewToggle } from "../kit";
import { filterVisibleLinks, useChurchLinks } from "../../hooks/useConfig";
import { useEngagementSort } from "../../hooks/useEngagementSort";
import { LINK_VIEW_COUNTS_KEY, linkId, linkTarget } from "../../helpers/dashboardLinks";

interface Props {
  config: ConfigurationInterface;
}

const tc = mobileTheme.colors;
const leadIconSx = { fontSize: 22, color: tc.textSecondary, flex: "none" };
const trailIconSx = { fontSize: 18, color: tc.textSecondary, flex: "none" };
const newTab = { target: "_blank", rel: "noopener noreferrer" };
const srOnly = { position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" } as const;

export const MoreCardsPage = ({ config }: Props) => {
  const context = useContext(UserContext);
  const pathname = usePathname();
  const { mode, setMode } = useMobileThemeMode();
  const churchName = config?.church?.name || "";
  const jwt = context?.userChurch?.jwt;
  const signedIn = !!context?.user;

  const firstName = context?.person?.name?.first || context?.user?.firstName || "";
  const lastName = context?.person?.name?.last || context?.user?.lastName || "";
  const photoUrl = context?.person?.photo ? PersonHelper.getPhotoUrl(context.person) : undefined;
  const canAccessAdmin = UserHelper.currentUserChurch && UserHelper.checkAccess(Permissions.contentApi.content.edit);

  const [showInstall, setShowInstall] = React.useState(false);
  React.useEffect(() => { setShowInstall(!WebPushHelperBase.isStandalone()); }, []);

  const adminUrl = useMemo(() => {
    if (!canAccessAdmin || !context?.userChurch?.jwt || !context?.userChurch?.church?.id) return "";
    const url = new URL("/login", EnvironmentHelper.Common.B1AdminRoot);
    url.searchParams.set("churchId", context.userChurch.church.id);
    url.searchParams.set("returnUrl", "/");
    url.hash = "jwt=" + encodeURIComponent(context.userChurch.jwt);
    return url.toString();
  }, [canAccessAdmin, context?.userChurch?.jwt, context?.userChurch?.church?.id]);

  const { data: rawLinks } = useChurchLinks(config?.church?.id, jwt);
  const visible = useMemo(() => filterVisibleLinks(rawLinks, context?.userChurch), [rawLinks, context?.userChurch]);
  const { increment: incrementViewCount } = useEngagementSort(visible, LINK_VIEW_COUNTS_KEY, linkId);

  // Admin separators become section breaks.
  const groups = useMemo(() => {
    const out: LinkInterface[][] = [[]];
    visible.forEach((l) => {
      if (l.linkType === "separator") out.push([]);
      else if (linkTarget(l)) out[out.length - 1].push(l);
    });
    return out.filter((g) => g.length > 0);
  }, [visible]);

  const linkRow = (l: LinkInterface) => {
    const target = linkTarget(l)!;
    return (
      <Row
        key={linkId(l)}
        href={target.href}
        onClick={() => incrementViewCount(linkId(l))}
        leading={<Icon sx={leadIconSx}>{linkTypeToIcon(l.linkType, l.icon)}</Icon>}
        title={l.text}
        chevron={!target.external}
        trailing={target.external ? <OpenInNewIcon sx={trailIconSx} /> : undefined}
        {...(target.external ? newTab : {})}
      />
    );
  };

  const modeOption = (value: MobileThemeMode, label: string, action: string) => ({
    value,
    label: value === mode ? label : <><span aria-hidden="true">{label}</span><Box component="span" sx={srOnly}>{action}</Box></>
  });

  return (
    <Box>
      <PageHead title={Locale.label("mobile.components.more")} />
      <Plate>
        {signedIn && (
          <PlateSection>
            <Box sx={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <Avatar src={photoUrl} variant="rounded" sx={{ width: 48, height: 48, borderRadius: "12px", bgcolor: tc.primary, color: tc.onPrimary, fontSize: 17, fontWeight: 600 }}>
                {getInitials({ name: { first: firstName, last: lastName } })}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ fontSize: 17, lineHeight: "23px", fontWeight: 600, color: tc.text }}>{`${firstName} ${lastName}`.trim()}</Typography>
                <TextLink href="/mobile/profileEdit">{Locale.label("mobile.components.editProfile")}</TextLink>
              </Box>
            </Box>
          </PlateSection>
        )}

        {groups.map((g, i) => (
          <PlateSection key={i} title={i === 0 ? churchName : undefined}>
            <RowList>{g.map(linkRow)}</RowList>
          </PlateSection>
        ))}

        <PlateSection title={Locale.label("mobile.more.account")}>
          <RowList>
            {signedIn && <Row href="/mobile/me" leading={<Icon sx={leadIconSx}>person</Icon>} title={Locale.label("mobile.me.title")} chevron />}
            <Row
              leading={<Icon sx={leadIconSx}>dark_mode</Icon>}
              title={Locale.label("mobile.more.appearance")}
              trailing={(
                <ViewToggle
                  label={Locale.label("mobile.more.appearance")}
                  value={mode}
                  onChange={setMode}
                  options={[
                    modeOption("light", Locale.label("mobile.components.lightMode"), Locale.label("mobile.components.switchToLight")),
                    modeOption("dark", Locale.label("mobile.components.darkMode"), Locale.label("mobile.components.switchToDark"))
                  ]}
                />
              )}
            />
            {canAccessAdmin && adminUrl && (
              <Row href={adminUrl} leading={<Icon sx={leadIconSx}>settings</Icon>} title={Locale.label("header.adminPortal")} trailing={<OpenInNewIcon sx={trailIconSx} />} />
            )}
            {showInstall && <Row href="/mobile/install" leading={<Icon sx={leadIconSx}>install_mobile</Icon>} title={Locale.label("mobile.screenTitles.installApp")} chevron />}
          </RowList>
        </PlateSection>

        <PlateSection>
          {signedIn ? (
            // Plain anchor, not a client Link: sign-out should reload and drop every kept-alive screen.
            <Box
              component="a"
              href="/mobile/logout"
              sx={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: 14, lineHeight: "20px", fontWeight: 600, color: tc.error, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
            >
              <LogoutIcon sx={{ fontSize: 18 }} />{Locale.label("mobile.more.signOut")}
            </Box>
          ) : (
            <Button variant="contained" href={pathname ? `/mobile/login?returnUrl=${encodeURIComponent(pathname)}` : "/mobile/login"}>
              {Locale.label("mobile.components.signIn")}
            </Button>
          )}
          <Typography sx={{ mt: "10px", fontSize: 13.5, lineHeight: "19px", color: tc.textSecondary }}>
            {churchName && `${churchName} · `}
            <TextLink href="https://churchapps.org/privacy" sx={{ fontSize: 13.5 }}>{Locale.label("mobile.components.privacyPolicy")}</TextLink>
          </Typography>
        </PlateSection>
      </Plate>
    </Box>
  );
};
