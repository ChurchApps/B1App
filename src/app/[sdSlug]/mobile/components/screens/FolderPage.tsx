"use client";

import React, { useContext, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Icon } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { type LinkInterface } from "@churchapps/helpers";
import { Locale } from "@churchapps/apphelper";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme, linkTypeToIcon } from "../mobileTheme";
import { PageHead, Plate, PlateSection, QuietEmpty, Row, RowList } from "../kit";
import { ScreenSkeleton } from "../ScreenSkeleton";
import { PhotoTile, linkPhoto } from "../DashboardPage";
import { filterVisibleLinks, folderChildren, useChurchLinks } from "../../hooks/useConfig";
import { useEngagementSort } from "../../hooks/useEngagementSort";
import { LINK_VIEW_COUNTS_KEY, linkId, linkTarget } from "../../helpers/dashboardLinks";

interface Props {
  config: ConfigurationInterface;
}

const tc = mobileTheme.colors;
const leadIconSx = { fontSize: 22, color: tc.textSecondary, flex: "none" };
const trailIconSx = { fontSize: 18, color: tc.textSecondary, flex: "none" };
const newTab = { target: "_blank", rel: "noopener noreferrer" };

// A Folder tab's screen: the tabs inside it, as photo tiles when every one has a photo, otherwise as More-style rows.
export const FolderPage = ({ config }: Props) => {
  const context = useContext(UserContext);
  const params = useSearchParams();
  const folderId = params?.get("id") || "";
  const jwt = context?.userChurch?.jwt;

  const { data: rawLinks, isLoading } = useChurchLinks(config?.church?.id, jwt);
  const visible = useMemo(() => filterVisibleLinks(rawLinks, context?.userChurch), [rawLinks, context?.userChurch]);
  const folder = visible.find((l) => l.id === folderId && l.linkType === "folder");
  const children = useMemo(() => (folder ? folderChildren(visible, folder.id).filter((l) => linkTarget(l)) : []), [visible, folder]);
  const { increment: incrementViewCount } = useEngagementSort(children, LINK_VIEW_COUNTS_KEY, linkId);
  const title = folder?.text || params?.get("title") || "";

  if (isLoading && !rawLinks) return <ScreenSkeleton />;

  const allPhotos = children.length > 0 && children.every((l) => linkPhoto(l));

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

  return (
    <Box>
      <PageHead title={title} />
      <Plate>
        <PlateSection>
          {children.length === 0 ? (
            <QuietEmpty>{Locale.label("mobile.folder.empty")}</QuietEmpty>
          ) : allPhotos ? (
            <Box data-testid="folder-tile-grid" sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {children.map((l, i) => <PhotoTile key={linkId(l)} link={l} wide={i === 0 && children.length % 2 === 1} />)}
            </Box>
          ) : (
            <RowList>{children.map(linkRow)}</RowList>
          )}
        </PlateSection>
      </Plate>
    </Box>
  );
};
