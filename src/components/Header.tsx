import Link from "next/link";
import { ChurchInterface } from "@/helpers";
import { Container, AppBar, Stack, Box } from "@mui/material";
import { useEffect, useState } from "react";

type Props = {
  church: ChurchInterface;
  churchSettings: any;
};

export function Header(props: Props) {

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
    if (transparent) return props.churchSettings?.logoDark || ""; //return "https://content.churchapps.org/3/settings/logoDark.png?dt=1638219047334";
    else return props.churchSettings?.logoLight || ""; //"https://content.churchapps.org/3/settings/logoLight.png?dt=1638219047334";
  }


  return (
    <div>
      <AppBar id="navbar" position="fixed" className={(transparent) ? "transparent" : ""}>
        <Container>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Link href="/"><img src={getLogo()} alt={props.church.name} /></Link>
            <Box sx={{ display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
              <Link href="/about">About Us</Link> &nbsp; &middot; &nbsp;
              <Link href="/newhere">New Here?</Link>

            </Box>
          </Stack>
        </Container>
      </AppBar>
    </div >
  );

}
