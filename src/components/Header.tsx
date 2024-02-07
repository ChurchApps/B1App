import { useEffect, useState } from "react";
import Link from "next/link";
import { Container, AppBar, Stack, Box, IconButton, Menu, MenuItem } from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import { ChurchInterface, LinkInterface } from "@churchapps/apphelper";
import CascadingHoverMenus from "./CascadingMenus/CascadingHoverMenus";
import { SectionInterface } from "@/helpers";

type Props = {
  church: ChurchInterface;
  churchSettings: any;
  navLinks?: LinkInterface[];
  overlayContent: boolean;
  sections?: SectionInterface[];
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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

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

  const getFirstSectionTextColor = () => {
    let result = "light";
    if (props.sections?.length > 0) result = props.sections[0].textColor;
    return result;
  }

  const getLinkClass = () => {
    let result = "";
    if (props.sections?.length > 0) {
      let lc = props.sections[0].linkColor;
      if (lc) {
        lc = lc.replace("var(--", "").replace(")", "");
        result = "links" + lc[0].toUpperCase() + lc.slice(1);
      }
    }
    return result;
  }

  const getLogo = () => {
    if (transparent) {
      let result = (getFirstSectionTextColor()==="dark")
        ?  props.churchSettings?.logoLight || ""
        :  props.churchSettings?.logoDark || "";
      return result;
    }
    else return props.churchSettings?.logoLight || ""; //"https://content.churchapps.org/3/settings/logoLight.png?dt=1638219047334";
  }

  //structured navLinks based on their parentId
  const structuredData = props.navLinks && getNestedChildren(props.navLinks, undefined);

  const getLinks = () => structuredData && structuredData.map((item) => <CascadingHoverMenus link={item} />);

  const handleClose = () => {
    setAnchorEl(null);
  };

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
            <IconButton size="large" color="inherit" aria-label="menu" id="nav-menu" aria-controls={open ? 'long-menu' : undefined} aria-expanded={open ? 'true' : undefined} aria-haspopup="true" sx={{ display: { xs: "flex", md: "none" } }} onClick={(e) => setAnchorEl(e.currentTarget)}>
              <MenuIcon />
            </IconButton>
            <Menu id="nav-menu" MenuListProps={{ 'aria-labelledby': 'long-button' }} anchorEl={anchorEl} open={open} onClose={handleClose} PaperProps={{ style: { width: '20ch' } }}>
              {props.navLinks?.map((l) => (
                <Link key={l.id} href={l.url} style={{ textDecoration: "none", color: "inherit" }}>
                  <MenuItem onClick={handleClose}>
                    {l.text}
                  </MenuItem>
                </Link>
              ))}
            </Menu>
          </Stack>
        </Container>
      </AppBar>
    </div>
  );

}
