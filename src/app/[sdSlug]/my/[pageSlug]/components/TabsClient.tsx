"use client";

import React, { useEffect, useMemo, useState } from "react";

import { UserHelper } from "@churchapps/apphelper";
import { ApiHelper } from "@churchapps/apphelper";
import { Permissions, LinkInterface } from "@churchapps/helpers";
import { PersonHelper } from "@/helpers"
import UserContext from "@/context/UserContext";
import Link from "next/link";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { IconButton, useMediaQuery, useTheme } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";

interface TabItem {
  url: string;
  label: string;
}

interface Props {
  config: ConfigurationInterface;
}

export const TabsClient = (props: Props) => {
  const context = React.useContext(UserContext);
  PersonHelper.person = context.person;
  const [navLinks, setNavLinks] = React.useState<LinkInterface[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    // Load b1Tab links for the /my section navigation
    // Use authenticated endpoint when logged in for server-side visibility filtering
    const loadLinks = async () => {
      if (!props.config?.church?.id) return;

      const churchId = props.config.church.id;

      if (context.userChurch?.jwt) {
        try {
          // Use authenticated endpoint - ApiHelper uses the church JWT set by setDefaultPermissions
          const links = await ApiHelper.get(`/links/church/${churchId}/filtered?category=b1Tab`, "ContentApi");
          // Filter "team" visibility client-side (group tags aren't in JWT)
          const userGroupTags = context.userChurch.groups?.flatMap((g: any) => g.tags?.split(",") || []) || [];
          const filtered = links.filter((link: any) => {
            if (link.visibility === "team") return userGroupTags.includes("team");
            return true;
          });
          setNavLinks(filtered);
        } catch (error) {
          // Fall back to anonymous if authenticated call fails
          console.warn("Authenticated links call failed, falling back to anonymous:", error);
          const allLinks = await ApiHelper.getAnonymous(`/links/church/${churchId}?category=b1Tab`, "ContentApi");
          const filtered = allLinks.filter((link: any) => !link.visibility || link.visibility === "everyone");
          setNavLinks(filtered);
        }
      } else {
        // Fallback to anonymous endpoint (will only get "everyone" visibility items)
        const allLinks = await ApiHelper.getAnonymous(`/links/church/${churchId}?category=b1Tab`, "ContentApi");
        const filtered = allLinks.filter((link: any) => !link.visibility || link.visibility === "everyone");
        setNavLinks(filtered);
      }
    };

    loadLinks();
  }, [props.config?.church?.id, context.userChurch?.jwt]);

  const getLinkRoute = (link: LinkInterface): string | null => {
    switch (link.linkType) {
      case "groups":
        return "/my/groups";
      case "directory":
        return "/my/community";
      case "plans":
        return "/my/plans";
      case "checkin":
        return "/my/checkin";
      case "lessons":
        return "/my/lessons";
      case "donation":
        return "/my/donate";
      default:
        // Other link types (bible, sermons, stream, etc.) don't have /my routes
        return null;
    }
  };

  const getTabs = useMemo(() => {
    const tabs: TabItem[] = [];
    const showAdmin = UserHelper.checkAccess(Permissions.membershipApi.people.view);

    // Always show timeline first
    tabs.push({ url: "/my/timeline", label: "Timeline" });

    // Map visible links to /my/* routes (already filtered by API)
    navLinks.forEach((link: LinkInterface) => {
      const route = getLinkRoute(link);
      if (route) {
        tabs.push({ url: route, label: link.text });
      }
    });

    // Admin tab uses permission check, not visibility
    if (showAdmin && context.userChurch?.jwt) {
      tabs.push({
        url: `https://admin.b1.church/login?jwt=${context.userChurch.jwt}&churchId=${context.userChurch.church.id}&returnUrl=/`,
        label: "Admin"
      });
    }

    return tabs;
  }, [navLinks, context.userChurch]);

  const handleMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLinkClick = () => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const getItem = (tab: TabItem) => (
    <li key={tab.url}>
      <Link
        href={tab.url}
        data-testid={`my-tab-${tab.label.toLowerCase()}`}
        aria-label={`Go to ${tab.label}`}
        onClick={handleLinkClick}
      >
        {tab.label}
      </Link>
    </li>
  );

  if (isMobile) {
    return (
      <div className="mobileNav">
        <IconButton
          onClick={handleMenuToggle}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          className="mobileMenuToggle"
        >
          {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          <span className="mobileMenuLabel">Menu</span>
        </IconButton>
        {mobileMenuOpen && (
          <ul data-testid="my-portal-tabs" aria-label="Member portal navigation" className="mobileMenuList">
            {getTabs.map((tab) => getItem(tab))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <ul data-testid="my-portal-tabs" aria-label="Member portal navigation">
      {getTabs.map((tab) => getItem(tab))}
    </ul>
  );
};
