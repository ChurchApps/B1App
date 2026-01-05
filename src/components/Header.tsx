"use client";

import { useEffect, useState, useContext } from "react";
import Link from "next/link";
import { Container, AppBar, Stack, Box, IconButton, List, Drawer, Toolbar, Chip, Icon, Menu, MenuItem, ListItem, ListItemButton, ListItemText, ListItemIcon, Collapse } from "@mui/material";
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
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
import { StyleHelper } from "@churchapps/apphelper-website";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import UserContext from "@/context/UserContext";


type Props = {
  config: ConfigurationInterface;
  overlayContent: boolean;
  sections?: SectionInterface[];
  editMode?: boolean;
  linkColor?: string;
};

//structure navLinks based on their parentId
const getNestedChildren = (arr: LinkInterface[], parent: string | undefined) => {
  const result: LinkInterface[] = [];
  for (const i in arr) {
    if ((arr[i].parentId ?? undefined) === parent) {
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
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [editMenuAnchor, setEditMenuAnchor] = useState<HTMLElement | null>(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [logoError, setLogoError] = useState(false);
  const pathname = usePathname()
  const context = useContext(UserContext);


  const toggleDrawer = () => {
    setOpen(!open);
  }

  useEffect(() => {
    if (typeof window !== "undefined" && props.config?.church?.id) {
      ApiHelper.getAnonymous("/settings/public/" + props.config?.church.id, "ContentApi").then((data: { showLogin?: string }) => {
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

  // Reset logo error state when logo URL changes
  useEffect(() => {
    setLogoError(false);
  }, [props.config?.appearance?.logoLight, props.config?.appearance?.logoDark, transparent]);

  const memberPortal = <MenuItem onClick={() => { redirect("/my") }} dense data-testid="member-portal-menu-item" aria-label="Go to member portal"><Icon sx={{ marginRight: "10px", fontSize: "20px !important" }}>person</Icon> Member Portal</MenuItem>
  const adminPortal = (UserHelper.currentUserChurch && UserHelper.checkAccess(Permissions.contentApi.content.edit)) && (
    <MenuItem onClick={() => { window.location.href = `https://admin.b1.church/login?jwt=${context.userChurch.jwt}&churchId=${context.userChurch.church.id}&returnUrl=/` }} dense data-testid="admin-portal-menu-item" aria-label="Go to admin portal"><Icon sx={{ marginRight: "10px", fontSize: "20px !important" }}>settings</Icon> Admin Portal</MenuItem>
  );

  const getAccountUrl = () => {
    const jwt = context.userChurch?.jwt;
    const churchId = context.userChurch?.church?.id;
    return `https://admin.b1.church/login?jwt=${jwt}&churchId=${churchId}&returnUrl=/profile`;
  };

  const handleEditMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setEditMenuAnchor(event.currentTarget);
  };

  const handleCloseAllMenus = () => {
    setEditMenuAnchor(null);
    setMenuAnchor(null);
  };

  const userAction = ApiHelper.isAuthenticated
    ? (
      <Box component="div" sx={{ marginRight: "15px", marginLeft: { xs: "15px", md: 0 }, ":hover #userMenuLink": { backgroundColor: "#36547e", color: "white" }, ":hover #userIcon": { color: "white !important" }, fontSize: "14px" }}>
        <Chip
          id="userMenuLink"
          label={`${UserHelper.user.firstName} ${UserHelper.user.lastName}`}
          icon={<Icon id="userIcon" sx={{ color: "#36547e !important" }}>account_circle</Icon>}
          sx={{ borderColor: "#36547e", color: "#36547e", minWidth: "100%" }}
          onClick={(e) => { e.preventDefault(); setMenuAnchor((Boolean(menuAnchor)) ? null : e.currentTarget); }}
          data-testid="user-menu-chip"
          aria-label="User menu"
        />
        <Menu id="useMenu" anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => { if (!editMenuAnchor) { setMenuAnchor(null); } }} MenuListProps={{ "aria-labelledby": "userMenuLink" }} sx={{ top: 5 }}>
          {memberPortal}
          {adminPortal}
          <MenuItem onClick={handleEditMenuOpen} dense data-testid="edit-menu-item" aria-label="Edit profile options">
            <Icon sx={{ marginRight: "10px", fontSize: "20px !important" }}>person</Icon> Edit Profile
            <Icon sx={{ marginLeft: "auto", fontSize: "18px !important" }}>chevron_right</Icon>
          </MenuItem>
          <MenuItem onClick={() => { redirect("/logout") }} sx={{ color: "#d32f2f" }} dense data-testid="logout-menu-item" aria-label="Logout"><Icon sx={{ marginRight: "10px", fontSize: "20px !important" }}>logout</Icon> Logout</MenuItem>
        </Menu>
        <Menu
          id="editSubMenu"
          anchorEl={editMenuAnchor}
          open={Boolean(editMenuAnchor)}
          onClose={handleCloseAllMenus}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
        >
          <MenuItem onClick={() => { handleCloseAllMenus(); window.location.href = getAccountUrl(); }} dense data-testid="account-menu-item" aria-label="Edit account settings">
            <Icon sx={{ marginRight: "10px", fontSize: "20px !important" }}>settings</Icon> Edit Account
          </MenuItem>
          <MenuItem onClick={() => { handleCloseAllMenus(); redirect(`/my/community/${PersonHelper?.person?.id}`); }} dense data-testid="church-profile-menu-item" aria-label="Edit church profile">
            <Icon sx={{ marginRight: "10px", fontSize: "20px !important" }}>church</Icon> Edit Church Profile
          </MenuItem>
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
        <ListItemButton onClick={() => { window.location.href = `https://admin.b1.church/login?jwt=${context.userChurch.jwt}&churchId=${context.userChurch.church.id}&returnUrl=/` }} data-testid="admin-portal-list-item" aria-label="Go to admin portal">
          <ListItemIcon><Icon color="secondary">settings</Icon></ListItemIcon>
          <ListItemText primary="Admin Portal" />
        </ListItemButton>
      </ListItem>
    </>)}
    <ListItem disablePadding>
      <ListItemButton onClick={() => setEditDrawerOpen(!editDrawerOpen)} data-testid="edit-list-item" aria-label="Edit profile options">
        <ListItemIcon><Icon color="secondary">person</Icon></ListItemIcon>
        <ListItemText primary="Edit Profile" />
        {editDrawerOpen ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
    </ListItem>
    <Collapse in={editDrawerOpen} timeout="auto" unmountOnExit>
      <List component="div" disablePadding>
        <ListItem disablePadding>
          <ListItemButton sx={{ pl: 4 }} onClick={() => { window.location.href = getAccountUrl(); }} data-testid="account-list-item" aria-label="Edit account settings">
            <ListItemIcon><Icon color="secondary">settings</Icon></ListItemIcon>
            <ListItemText primary="Edit Account" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton sx={{ pl: 4 }} onClick={() => { redirect(`/my/community/${PersonHelper?.person?.id}`); }} data-testid="church-profile-list-item" aria-label="Edit church profile">
            <ListItemIcon><Icon color="secondary">church</Icon></ListItemIcon>
            <ListItemText primary="Edit Church Profile" />
          </ListItemButton>
        </ListItem>
      </List>
    </Collapse>
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

  const logo = getLogo();
  const showLogoImage = logo && !logoError;

  return (
    <div>
      <AppBar id="navbar" position={(props.editMode) ? "relative" : "fixed"} className={appBarClass} style={(props.editMode) ? { marginBottom: 0 } : {}}>
        <Container style={{ height: 71 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Link href="/" data-testid="header-logo-link" aria-label="Go to homepage">
              {showLogoImage
                ? (<img src={logo} alt={props.config?.church.name} id="headerLogo" data-testid="header-logo" onError={() => setLogoError(true)} />)
                : (<Box component="span" id="headerLogo" data-testid="header-church-name" sx={{ fontSize: "1.5rem", fontWeight: 600, display: "inline-block", lineHeight: 1 }}>{props.config?.church.name}</Box>)}
            </Link>
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
