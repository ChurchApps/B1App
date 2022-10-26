import React from "react";
import { AppBar, Drawer, IconButton, styled, Toolbar, Icon, Typography, Box, Container, Link } from "@mui/material";
import { UserHelper, AppearanceHelper, PersonHelper } from "../../helpers";
import { UserMenu } from "./UserMenu";
import { UserContextInterface } from "../../interfaces";
import useMountedState from "../../hooks/useMountedState";

interface Props {
  navContent: JSX.Element,
  context: UserContextInterface,
  children: React.ReactNode,
  appName: string,
  router?: any
}

const OpenDrawer = styled(Drawer)(
  ({ theme }) => ({
    "& .MuiDrawer-paper": {
      position: "relative",
      backgroundColor: theme.palette.primary.main,
      color: "#FFFFFF",
      whiteSpace: "nowrap",
      width: "100vw",
      zIndex: 9999,
      [theme.breakpoints.up("md")]: { width: 220 },
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen
      }),
      boxSizing: "border-box"
    },
    "& .MuiListItemButton-root, & .MuiListItemIcon-root": { color: "#FFFFFF" }
  })
);

const ClosedDrawer = styled(OpenDrawer)(
  ({ theme }) => ({
    overflowX: "hidden",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    zIndex: 1,
    width: theme.spacing(7),
    [theme.breakpoints.up("sm")]: { width: theme.spacing(7) },
    "& .MuiListSubheader-root": {
      opacity: 0
    }
  })
);

const ClosedDrawerAppBar = styled(AppBar)(
  ({ theme }) => ({
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    "& .MuiIcon-root": { color: "#FFFFFF" }
  })
);

const OpenDrawerAppBar = styled(ClosedDrawerAppBar)(
  ({ theme }) => ({
    marginLeft: 220,
    width: `calc(100% - ${220}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  })
);

export const SiteWrapper: React.FC<Props> = props => {
  const [churchLogo, setChurchLogo] = React.useState<string>();
  const [open, setOpen] = React.useState(false);
  const toggleDrawer = () => { setOpen(!open); };
  const isMounted = useMountedState();

  const CustomDrawer = (open) ? OpenDrawer : ClosedDrawer;
  const CustomAppBar = (open) ? OpenDrawerAppBar : ClosedDrawerAppBar;

  const getChurchLogo = async () => {
    if (UserHelper.currentChurch) {
      const logos = await AppearanceHelper.load(UserHelper.currentChurch?.id);
      setChurchLogo(logos.logoDark || "/images/logo-wrapper.png");
    }
  }

  React.useEffect(() => {
    if(!isMounted()) {
      getChurchLogo();
    }
  }, [isMounted]);

  return <>
    <CustomAppBar position="absolute">
      <Toolbar sx={{ pr: "24px" }}>
        <IconButton edge="start" color="inherit" aria-label="open drawer" onClick={toggleDrawer} sx={{ marginRight: "36px", ...(open && { display: "none" }) }}>
          <Icon>menu</Icon>
        </IconButton>
        <Typography variant="h6" noWrap>{UserHelper.currentChurch?.name || ""}</Typography>
        <div style={{ flex: 1 }}></div>
        {UserHelper.user && <UserMenu profilePicture={PersonHelper.getPhotoUrl(props.context?.person)} userName={`${UserHelper.user?.firstName} ${UserHelper.user?.lastName}`} churches={UserHelper.churches} currentChurch={UserHelper.currentChurch} context={props.context} appName={props.appName} router={props.router} />}
        {!UserHelper.user && <Link href="/login" color="inherit" style={{ textDecoration: "none" }}>Login</Link>}
      </Toolbar>
    </CustomAppBar>

    <CustomDrawer variant="permanent" open={open}>
      <Toolbar sx={{ display: "flex", alignItems: "center", width: "100%", px: [1] }}>
        <img src={churchLogo || "/images/logo-wrapper.png"} alt="logo" style={{ maxWidth: 170 }} />
        <div style={{ justifyContent: "flex-end", flex: 1, display: "flex" }}>
          <IconButton onClick={toggleDrawer}><Icon style={{ color: "#FFFFFF" }}>chevron_left</Icon></IconButton>
        </div>
      </Toolbar>
      {props.navContent}
    </CustomDrawer>
    <Box component="main" sx={{ flexGrow: 1, overflow: "auto", marginTop: 8, minHeight: "90vh" }}>
      <Container maxWidth={false} sx={{ mt: 4, mb: 4 }}>
        {props.children}
      </Container>
    </Box>
  </>
};
