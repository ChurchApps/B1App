import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container, AppBar, Stack, Box, IconButton, List, Drawer, Toolbar, Chip, Icon, Menu, MenuItem, ClickAwayListener, ListItem, ListItemButton, ListItemText, ListItemIcon } from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { ApiHelper, AppearanceHelper, ArrayHelper, ChurchInterface, LinkInterface, Permissions, UserHelper } from "@churchapps/apphelper";
import CascadingHoverMenus from "./CascadingMenus/CascadingHoverMenus";
import CascadingListMenu from "./CascadingMenus/CascadingListMenu";
import { GlobalStyleInterface, PersonHelper, SectionInterface } from "@/helpers";

type Props = {
  church: ChurchInterface;
  churchSettings: any;
  navLinks?: LinkInterface[];
  overlayContent: boolean;
  sections?: SectionInterface[];
  globalStyles?: GlobalStyleInterface;
};

//structure navLinks based on their parentId
const getNestedChildren = (arr: LinkInterface[], parent: string) => {
  const result: LinkInterface[] = [];
  for(const i in arr) {
    if(arr[i].parentId == parent) {
      if (arr[i].id) {
        const children = getNestedChildren(arr, arr[i].id);
        if(children.length) {
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

  const toggleDrawer = () => {
    setOpen(!open);
  }

  useEffect(() => {
    const handleScroll = () => {
      if (props.overlayContent)
      {
        const show = window.scrollY > 100
        setTransparent(!show);
      }
    }
    document.addEventListener('scroll', handleScroll)
    return () => {
      document.removeEventListener('scroll', handleScroll)
    }
  }, []);

  const pathName = usePathname();
  const returnUrl = (pathName === "/") ? "" :  `?returnUrl=${encodeURIComponent(pathName)}`;

  const memberPortal = <MenuItem component="a" href="/testing24/login?returnUrl=/testing24/member" dense><Icon sx={{ marginRight: "10px", fontSize: "20px !important" }}>person</Icon> Member Portal</MenuItem>
  const adminPortal = UserHelper.checkAccess(Permissions.contentApi.content.edit) && (
    <MenuItem component="a" href="/testing24/login?returnUrl=/testing24/admin" dense><Icon sx={{ marginRight: "10px", fontSize: "20px !important" }}>settings</Icon> Admin Portal</MenuItem>
  );

  const editProfile = <MenuItem component="a" href={`/testing24/login?returnUrl=/testing24/member/directory/${PersonHelper?.person?.id}`} dense><Icon sx={{ marginRight: "10px", fontSize: "20px !important" }}>manage_accounts</Icon> Edit profile</MenuItem>

  const userAction = ApiHelper.isAuthenticated
    ? (
      <Box component="div" sx={{ marginRight: "15px", marginLeft: {xs: "15px", md: 0}, ":hover #userMenuLink": { backgroundColor: "#36547e", color: "white" }, ":hover #userIcon": { color: "white !important" }, fontSize: "14px" }}>
        <ClickAwayListener onClickAway={() => setMenuAnchor(null)}>
          <Chip
            id="userMenuLink"
            label={`${UserHelper.user.firstName} ${UserHelper.user.lastName}`}
            icon={<Icon id="userIcon" sx={{ color: "#36547e !important" }}>account_circle</Icon>}
            sx={{ borderColor: "#36547e", color: "#36547e", minWidth: "100%" }}
            onClick={(e) => { e.preventDefault(); setMenuAnchor((Boolean(menuAnchor)) ? null : e.target); }}
          />
        </ClickAwayListener>
        <Menu id="useMenu" anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => { setMenuAnchor(null); }} MenuListProps={{ "aria-labelledby": "userMenuLink" }} sx={{ top: 5 }}>
          {memberPortal}
          {adminPortal}
          {editProfile}
          <MenuItem component="a" href="/logout" sx={{ color: "#d32f2f" }} dense><Icon sx={{ marginRight: "10px", fontSize: "20px !important" }}>logout</Icon> Logout</MenuItem>
        </Menu>
      </Box>
    )
    : (
      <Box sx={{ marginRight: "15px", marginLeft: {xs: "15px", md: 0}, fontSize: "14px", ":hover #loginButton": { backgroundColor: "#36547e", color: "white" }, ":hover #loginIcon": { color: "white" } }}>
        <Chip
          component="a"
          href={"/testing24/login" + returnUrl}
          clickable
          id="loginButton"
          label="Login"
          icon={<Icon id="loginIcon" sx={{ fontSize: "17px !important" }}>login</Icon>}
          sx={{ borderColor: "#36547e", color: "#36547e", minWidth: "100%" }}
        />
      </Box>
    )

  const userActionList = ApiHelper.isAuthenticated && (<>
    <ListItem disablePadding>
      <ListItemButton href="/testing24/login?returnUrl=/testing24/member">
        <ListItemIcon><Icon color="secondary">person</Icon></ListItemIcon>
        <ListItemText primary="Member Portal" />
      </ListItemButton>
    </ListItem>
    {UserHelper.checkAccess(Permissions.contentApi.content.edit) && (<>
      <ListItem disablePadding>
        <ListItemButton href="/testing24/login?returnUrl=/testing24/admin">
          <ListItemIcon><Icon color="secondary">settings</Icon></ListItemIcon>
          <ListItemText primary="Admin Portal" />
        </ListItemButton>
      </ListItem>
    </>)}
    <ListItem disablePadding>
      <ListItemButton href={`/testing24/login?returnUrl=/testing24/member/directory/${PersonHelper?.person?.id}`}>
        <ListItemIcon><Icon color="secondary">manage_accounts</Icon></ListItemIcon>
        <ListItemText primary="Edit Profile" />
      </ListItemButton>
    </ListItem>
  </>)

  const getLinkClass = () => {
    const sections = ArrayHelper.getAll(props.sections, "zone", "main");
    let result = "";
    if (sections?.length > 0) {
      let lc = sections[0].linkColor;
      if (lc) {
        lc = lc.replace("var(--", "").replace(")", "");
        result = "links" + lc[0].toUpperCase() + lc.slice(1);
      }
    }
    return result;
  }

  const getLogo = () => {
    if (transparent) {
      let textColor = props.sections[0].textColor || "#FFF";
      if (textColor.indexOf("var(--") > -1) {
        const palette = JSON.parse(props.globalStyles.palette);
        textColor = textColor.replace("var(--", "").replace(")", "");
        textColor = palette[textColor];
        if (!textColor) textColor = "#FFF"
      }
      let result = AppearanceHelper.getLogoByTextColor(props.churchSettings?.logoLight || "", props.churchSettings?.logoDark || "", textColor)
      return result;
    }
    else return props.churchSettings?.logoLight || ""; //"https://content.churchapps.org/3/settings/logoLight.png?dt=1638219047334";
  }

  //structured navLinks based on their parentId
  const structuredData = props.navLinks && getNestedChildren(props.navLinks, undefined);

  const getLinks = () => structuredData && structuredData.map((item) => <CascadingHoverMenus key={item.id} link={item} />);
  const getListMenu = () => structuredData && <List component="nav" id="long-menu">
    {userActionList}
    {structuredData.map((item) => <CascadingListMenu key={item.id} link={item} handleClose={() => toggleDrawer()} />)}
    {ApiHelper.isAuthenticated && (
      <ListItem disablePadding sx={{ color: "#d32f2f" }}>
        <ListItemButton href="/logout">
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
      <AppBar id="navbar" position="fixed" className={appBarClass}>
        <Container style={{height:71}}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Link href="/"><img src={getLogo()} alt={props.church.name} id="headerLogo" /></Link>
            <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", whiteSpace: "nowrap",  }}>
              {getLinks()}
              {userAction}
            </Box>
            <Box sx={{ display: { xs: "flex", md: "none" } }}>
              <IconButton size="large" color="inherit" id="nav-menu" onClick={toggleDrawer}>
                <MenuIcon />
              </IconButton>
              <Drawer open={open} onClose={toggleDrawer} anchor="right">
                <Toolbar disableGutters><IconButton onClick={toggleDrawer}><ChevronRightIcon /></IconButton></Toolbar>
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
