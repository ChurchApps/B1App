import { useEffect, useState } from "react";
import Link from "next/link";
import { Container, AppBar, Stack, Box, IconButton, Menu, MenuItem } from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import { ChurchInterface, LinkInterface } from "@/helpers";

type Props = {
  church: ChurchInterface;
  churchSettings: any;
  navLinks?: LinkInterface[];
};

export function Header(props: Props) {
  const [transparent, setTransparent] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    const handleScroll = () => {
      const show = window.scrollY > 100
      setTransparent(!show);
    }
    document.addEventListener('scroll', handleScroll)
    return () => {
      document.removeEventListener('scroll', handleScroll)
    }
  }, []);

  const getLogo = () => {
    if (transparent) return props.churchSettings?.logoDark || ""; //return "https://content.churchapps.org/3/settings/logoDark.png?dt=1638219047334";
    else return props.churchSettings?.logoLight || ""; //"https://content.churchapps.org/3/settings/logoLight.png?dt=1638219047334";
  }

  const getMenuColor = () => {
    if (transparent) return "#FFF";
    else return "#333";
  }

  const getLinks = () => {
    const result: JSX.Element[] = [];
    props.navLinks?.forEach(l => {
      result.push(<Link key={l.id} href={l.url} style={{ paddingLeft: 15, paddingRight: 15 }}>{l.text}</Link>);
    });
    return result;
  }

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
                  <MenuItem >
                    {l.text}
                  </MenuItem>
                </Link>
              ))}
            </Menu>
          </Stack>
        </Container>
      </AppBar>
    </div >
  );

}
