"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Container, AppBar, Stack, Box, IconButton, List, Drawer, Toolbar, Chip, Icon, Menu, MenuItem, ClickAwayListener, ListItem, ListItemButton, ListItemText, ListItemIcon } from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { ApiHelper } from "@churchapps/apphelper";
import { AppearanceHelper } from "@churchapps/apphelper";
import { ArrayHelper } from "@churchapps/apphelper";
import { UserHelper } from "@churchapps/apphelper";
import { Permissions } from "@churchapps/helpers";
import type { LinkInterface } from "@churchapps/helpers";
import CascadingHoverMenus from "./CascadingMenus/CascadingHoverMenus";
import CascadingListMenu from "./CascadingMenus/CascadingListMenu";
import { PersonHelper, SectionInterface, UrlHelper } from "@/helpers";
import { redirect, usePathname } from "next/navigation";
import { StyleHelper } from "@/helpers/StyleHelper";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";


type Props = {
  config: ConfigurationInterface;
  overlayContent: boolean;
  sections?: SectionInterface[];
  editMode?: boolean;
  linkColor?: string;
};

//structure navLinks based on their parentId
const getNestedChildren = (arr: LinkInterface[], parent: string) => {
  const result: LinkInterface[] = [];
  for (const i in arr) {
    if (arr[i].parentId == parent) {
      if (arr[i].id) {
        const children = getNestedChildren(arr, arr[i].id);
        if (children.length) {
          arr[i].children = children;
        }
      }
      result.push(arr[i]);
    }
  }
  return result;
}

export function Header(props: Props) {
  const [transparent, setTransparent] = useState(props.overlayContent);
  const [open, setOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<any>(null);
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const pathname = usePathname()


  const toggleDrawer = () => {
    setOpen(!open);
  }

  useEffect(() => {
    // ApiHelper.get("/settings/public/" + props.church.id, "ContentApi").then((data) => {
    //   if (data.showLogin) {
    //     if (data.showLogin === "true") setShowLogin(true);
    //     else setShowLogin(false);
    //   }
    // })

    if (typeof window !== "undefined" && props.config?.church?.id) {
      // Fetch settings from the API
      ApiHelper.getAnonymous("/settings/public/" + props.config?.church.id, "ContentApi").then((data: any) => {
        if (data.showLogin) {
          setShowLogin(data.showLogin === "true");
        }
      });
    }
    const handleScroll = () => {
      if (props.overlayContent) {
        const show = window.scrollY > 100
        setTransparent(!show);
      }
    }

    document.addEventListener('scroll', handleScroll)
    return () => {
      document.removeEventListener('scroll', handleScroll)
    }
  }, [props.config?.church?.id, props.overlayContent]);

  // const pathName = usePathname();
  // const returnUrl = (pathName === "/") ? "" :  `?returnUrl=${encodeURIComponent(pathName)}`;

  const memberPortal = <MenuItem onClick={() => { redirect("/my") }} dense data-testid="member-portal-menu-item" aria-label="Go to member portal"><Icon sx={{ marginRight: "10px", fontSize: "20px !important" }}>person</Icon> Member Portal</MenuItem>
  const adminPortal = UserHelper.checkAccess(Permissions.contentApi.content.edit) && (
    <MenuItem onClick={() => { redirect("/admin") }} dense data-testid="admin-portal-menu-item" aria-label="Go to admin portal"><Icon sx={{ marginRight: "10px", fontSize: "20px !important" }}>settings</Icon> Admin Portal</MenuItem>
  );

  const editProfile = <MenuItem onClick={() => { redirect(`/my/community/${PersonHelper?.person?.id}`) }} dense data-testid="edit-profile-menu-item" aria-label="Edit your profile"><Icon sx={{ marginRight: "10px", fontSize: "20px !important" }}>manage_accounts</Icon> Edit profile</MenuItem>

  const userAction = ApiHelper.isAuthenticated
    ? (
      <Box component="div" sx={{ marginRight: "15px", marginLeft: { xs: "15px", md: 0 }, ":hover #userMenuLink": { backgroundColor: "#36547e", color: "white" }, ":hover #userIcon": { color: "white !important" }, fontSize: "14px" }}>
        <ClickAwayListener onClickAway={() => setMenuAnchor(null)}>
          <Chip
            id="userMenuLink"
            label={`${UserHelper.user.firstName} ${UserHelper.user.lastName}`}
            icon={<Icon id="userIcon" sx={{ color: "#36547e !important" }}>account_circle</Icon>}
            sx={{ borderColor: "#36547e", color: "#36547e", minWidth: "100%" }}
            onClick={(e) => { e.preventDefault(); setMenuAnchor((Boolean(menuAnchor)) ? null : e.target); }}
            data-testid="user-menu-chip"
            aria-label="User menu"
          />
        </ClickAwayListener>
        <Menu id="useMenu" anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => { setMenuAnchor(null); }} MenuListProps={{ "aria-labelledby": "userMenuLink" }} sx={{ top: 5 }}>
          {memberPortal}
          {adminPortal}
          {editProfile}
          <MenuItem onClick={() => { redirect("/logout") }} sx={{ color: "#d32f2f" }} dense data-testid="logout-menu-item" aria-label="Logout"><Icon sx={{ marginRight: "10px", fontSize: "20px !important" }}>logout</Icon> Logout</MenuItem>
        </Menu>
      </Box>
    )
    : (
      <>
        {showLogin
          ? (
            <Box sx={{ marginRight: "15px", marginLeft: { xs: "15px", md: 0 }, fontSize: "14px", ":hover #loginButton": { backgroundColor: "#36547e", color: "white" }, ":hover #loginIcon": { color: "white" } }}>
              <Chip component="a" href={"/login?returnUrl=" + encodeURIComponent(UrlHelper.getReturnUrl(pathname, props.config.keyName)) } clickable id="loginButton" label="Login"
                icon={<Icon id="loginIcon" sx={{ fontSize: "17px !important" }}>login</Icon>}
                sx={{ borderColor: "#36547e", color: "#36547e", minWidth: "100%" }}
                data-testid="login-chip"
                aria-label="Login to your account"
              />
            </Box>
          )
          : null}
      </>
    )

  const userActionList = ApiHelper.isAuthenticated && (<>
    <ListItem disablePadding>
      <ListItemButton onClick={() => { redirect("/my") }} data-testid="member-portal-list-item" aria-label="Go to member portal">
        <ListItemIcon><Icon color="secondary">person</Icon></ListItemIcon>
        <ListItemText primary="Member Portal" />
      </ListItemButton>
    </ListItem>
    {UserHelper.checkAccess(Permissions.contentApi.content.edit) && (<>
      <ListItem disablePadding>
        <ListItemButton onClick={() => { redirect("/admin") }} data-testid="admin-portal-list-item" aria-label="Go to admin portal">
          <ListItemIcon><Icon color="secondary">settings</Icon></ListItemIcon>
          <ListItemText primary="Admin Portal" />
        </ListItemButton>
      </ListItem>
    </>)}
    <ListItem disablePadding>
      <ListItemButton onClick={() => { redirect(`/my/directory/${PersonHelper?.person?.id}`) }} data-testid="edit-profile-list-item" aria-label="Edit your profile">
        <ListItemIcon><Icon color="secondary">manage_accounts</Icon></ListItemIcon>
        <ListItemText primary="Edit Profile" />
      </ListItemButton>
    </ListItem>
  </>)

  const getLinkClass = () => {
    const sections = ArrayHelper.getAll(props.sections, "zone", "main");
    let result = "";

    let lc = props.linkColor || (sections.length > 0 ? sections[0].linkColor : null);
    if (lc) {
      lc = lc.replace("var(--", "").replace(")", "");
      result = "links" + lc[0].toUpperCase() + lc.slice(1);
    }

    return result;
  }

  const getLogo = () => {
    if (transparent) {
      const textColor=StyleHelper.getTextColor(props.sections[0]?.textColor, props.config?.globalStyles, props.config?.appearance);
      const logo = AppearanceHelper.getLogoByTextColor(props.config?.appearance?.logoLight || null, props.config?.appearance?.logoDark || null, textColor);
      return logo !== "" ? logo : null;
    }
    else return props.config?.appearance?.logoLight || null;
  }

  /*
  const getLogo = () => {
    if (transparent) {
      let textColor = props.sections[0]?.textColor || "#FFF";
      if (textColor.indexOf("var(--") > -1) {
        const palette = JSON.parse(props.globalStyles.palette);
        textColor = textColor.replace("var(--", "").replace(")", "");
        textColor = palette[textColor];
        if (!textColor) textColor = "#FFF";
      }
      const logo = AppearanceHelper.getLogoByTextColor(props.churchSettings?.logoLight || null, props.churchSettings?.logoDark || null, textColor);
      return logo !== "" ? logo : null;
    } else {
      return props.churchSettings?.logoLight || null;
    }
  };*/

  // const getLogo = () => {
  //   if (transparent) {
  //     let textColor = props.sections[0]?.textColor || "#FFF";
  //     if (textColor.indexOf("var(--") > -1) {
  //       const palette = JSON.parse(props.globalStyles.palette);
  //       textColor = textColor.replace("var(--", "").replace(")", "");
  //       textColor = palette[textColor];
  //       if (!textColor) textColor = "#FFF"
  //     }
  //     let result = AppearanceHelper.getLogoByTextColor(props.churchSettings?.logoLight || "", props.churchSettings?.logoDark || "", textColor)
  //     return result;
  //   }
  //   else return props.churchSettings?.logoLight || ""; //"https://content.churchapps.org/3/settings/logoLight.png?dt=1638219047334";
  // }

  //structured navLinks based on their parentId
  const structuredData = props.config?.navLinks && getNestedChildren(props.config?.navLinks, undefined);

  const getLinks = () => structuredData && structuredData.map((item) => <CascadingHoverMenus key={item.id} link={item} />);
  const getListMenu = () => structuredData && <List component="nav" id="long-menu">
    {userActionList}
    {structuredData.map((item) => <CascadingListMenu key={item.id} link={item} handleClose={() => toggleDrawer()} />)}
    {ApiHelper.isAuthenticated && (
      <ListItem disablePadding sx={{ color: "#d32f2f" }}>
        <ListItemButton onClick={() => { redirect("/logout") }} data-testid="logout-list-item" aria-label="Logout">
          <ListItemIcon><Icon sx={{ color: "#d32f2f" }}>logout</Icon></ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </ListItem>
    )}
  </List>;

  let appBarClass = "";
  if (transparent) {
    appBarClass = "transparent " + getLinkClass();
    //appBarClass = (getFirstSectionTextColor()==="dark")
    //?  "transparent light"
    //:  "transparent";
  }

  return (
    <div>
      <AppBar id="navbar" position={(props.editMode) ? "relative" : "fixed"} className={appBarClass} style={(props.editMode) ? { marginBottom: 0 } : {}}>
        <Container style={{ height: 71 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Link href="/" data-testid="header-logo-link" aria-label="Go to homepage"><img src={getLogo()} alt={props.config?.church.name} id="headerLogo" data-testid="header-logo" /></Link>
            <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", whiteSpace: "nowrap", }}>
              {getLinks()}
              {userAction}
            </Box>
            <Box sx={{ display: { xs: "flex", md: "none" } }}>
              <IconButton size="large" color="inherit" id="nav-menu" onClick={toggleDrawer} data-testid="mobile-menu-button" aria-label="Open navigation menu">
                <MenuIcon />
              </IconButton>
              <Drawer open={open} onClose={toggleDrawer} anchor="right">
                <Toolbar disableGutters><IconButton onClick={toggleDrawer} data-testid="close-drawer-button" aria-label="Close navigation menu"><ChevronRightIcon /></IconButton></Toolbar>
                <Box sx={{ width: { xs: '100vw', sm: '50vw' } }}>
                  {userAction}
                  {getListMenu()}
                </Box>
              </Drawer>
            </Box>
          </Stack>
        </Container>
      </AppBar>
    </div>
  );

}
