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
  sections: SectionInterface[];
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

  const getLogo = () => {
    if (transparent) {
      let result = props.churchSettings?.logoDark || "";
      if (props.sections?.length > 0) {
        const tc = props.sections[0].textColor;
        if (tc === "light") result = props.churchSettings?.logoLight || result;
        return result;
      }
      return result; //return "https://content.churchapps.org/3/settings/logoDark.png?dt=1638219047334";
    }
    else return props.churchSettings?.logoLight || ""; //"https://content.churchapps.org/3/settings/logoLight.png?dt=1638219047334";
  }

  const getMenuColor = () => {
    if (transparent) return "#FFF";
    else return "#333";
  }

  //structured navLinks based on their parentId
  const structuredData = props.navLinks && getNestedChildren(props.navLinks, undefined);

  const getLinks = () => structuredData && structuredData.map((item) => <CascadingHoverMenus link={item} />);

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <AppBar id="navbar" position="fixed" className={(transparent) ? "transparent" : ""}>
        <Container>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Link href="/"><img src={getLogo()} alt={props.church.name} id="headerLogo" /></Link>
            <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", whiteSpace: "nowrap",  }}>
              {getLinks()}
            </Box>
            <IconButton
              size="large"
              color="inherit"
              aria-label="menu"
              id="nav-menu"
              aria-controls={open ? 'long-menu' : undefined}
              aria-expanded={open ? 'true' : undefined}
              aria-haspopup="true"
              sx={{ display: { xs: "flex", md: "none" } }}
              onClick={(e) => setAnchorEl(e.currentTarget)}
            >
              <MenuIcon style={{color:getMenuColor()}} />
            </IconButton>
            <Menu
              id="nav-menu"
              MenuListProps={{
                'aria-labelledby': 'long-button',
              }}
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              PaperProps={{
                style: {
                  width: '20ch',
                },
              }}
            >
              {props.navLinks?.map((l) => (
                <Link key={l.id} href={l.url} style={{ textDecoration: "none", color: "inherit" }}>
                  <MenuItem>
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
