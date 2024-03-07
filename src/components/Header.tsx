import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Container, AppBar, Stack, Box, IconButton, List, Drawer, Toolbar } from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { AppearanceHelper, ArrayHelper, ChurchInterface, LinkInterface } from "@churchapps/apphelper";
import CascadingHoverMenus from "./CascadingMenus/CascadingHoverMenus";
import CascadingListMenu from "./CascadingMenus/CascadingListMenu";
import { GlobalStyleInterface, SectionInterface } from "@/helpers";

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
      const children = getNestedChildren(arr, arr[i].id);
      if(children.length) {
        arr[i].children = children;
      }
      result.push(arr[i]);
    }
  }
  return result;
}

export function Header(props: Props) {
  const [transparent, setTransparent] = useState(props.overlayContent);
  const [open, setOpen] = useState(false);

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
  const getListMenu = () => structuredData && <List component="nav" id="long-menu">{structuredData.map((item) => <CascadingListMenu key={item.id} link={item} handleClose={() => toggleDrawer()} />)}</List>;

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
        <Container>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Link href="/"><img src={getLogo()} alt={props.church.name} id="headerLogo" /></Link>
            <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", whiteSpace: "nowrap",  }}>
              {getLinks()}
            </Box>
            <Box sx={{ display: { xs: "flex", md: "none" } }}>
              <IconButton size="large" color="inherit" id="nav-menu" onClick={toggleDrawer}>
                <MenuIcon />
              </IconButton>
              <Drawer open={open} onClose={toggleDrawer} anchor="right">
                <Toolbar disableGutters><IconButton onClick={toggleDrawer}><ChevronRightIcon /></IconButton></Toolbar>
                <Box sx={{ width: { xs: '100vw', sm: '50vw' } }}>
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
