import Link from "next/link";
import { useRouter } from "next/router"
import { UserHelper, ApiHelper } from "@/utils";
import { ClickAwayListener, Container, Icon, Menu, MenuItem, AppBar, Stack, Box, Toolbar, IconButton, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";

export function Header() {

  const [transparent, setTransparent] = useState(true);

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
    if (transparent) return "https://content.churchapps.org/3/settings/logoDark.png?dt=1638219047334";
    else return "https://content.churchapps.org/3/settings/logoLight.png?dt=1638219047334";
  }


  return (
    <div>
      <AppBar id="navbar" position="fixed" className={(transparent) ? "transparent" : ""}>
        <Container>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Link href="/">
              <a className="logo"><img src={getLogo()} alt="Cedar Ridge Christian Church" /></a>
            </Link>
            <Box sx={{ display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
              <Link href="/about"><a>About Us</a></Link> &nbsp; &middot; &nbsp;
              <Link href="/newhere"><a>New Here?</a></Link>

            </Box>
          </Stack>
        </Container>
      </AppBar>
    </div >
  );


  /*
  return (
    <div>
      <AppBar id="navbar" position="fixed">
        <Container>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Link href="/">
              <a className="logo"><img src="https://content.churchapps.org/3/settings/logoLight.png?dt=1638219047334" alt="Cedar Ridge Christian Church" /></a>
            </Link>
            <Box sx={{ display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
              <Link href="/about"><a>About Us</a></Link> &nbsp; &middot; &nbsp;
              <Link href="/newhere"><a>New Here?</a></Link>

            </Box>
          </Stack>
        </Container>
      </AppBar>
      <div id="navSpacer" />
    </div>
  );*/
}
