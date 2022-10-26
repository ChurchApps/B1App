import React from "react";
import { Icon, ListItemButton, ListItemIcon, ListItemText, styled, Tooltip } from "@mui/material";
import { NavLink, useLocation } from "react-router-dom";

interface Props {
  url?: string;
  target?: string;
  label: string;
  icon: string;
  onClick?: () => void;
  router?: any;
  external?: boolean;
  selected?: boolean;
}

const StyledNavLink = styled(NavLink)({
  textDecoration: "none",
  "&:hover": { textDecoration: "none" },
  "& .MuiListItemIcon-root": { minWidth: 40 }
});

export const NavItem: React.FC<Props> = (props) => {
  let isReact = false;
  try {
    const a = typeof useLocation();
    if (a !== null) isReact = true;
  } catch { }

  const getIcon = () => <Icon>{props.icon}</Icon>

  const getLinkContents = () => (<ListItemButton>
    <Tooltip title={props.label || ""} arrow placement="right">
      <ListItemIcon sx={{ minWidth: "40px" }}>{getIcon()}</ListItemIcon>
    </Tooltip>
    <ListItemText primary={props.label} />
  </ListItemButton>)

  if (props.router) return (<a href={props.url} target={props.target} onClick={(e) => { e.preventDefault(); props.onClick ? props.onClick() : props.router.push(props.url) }} className={(props.selected) ? "selected" : ""}>{getLinkContents()}</a>)
  else if (props.external || !isReact) return (<a href={props.url} target={props.target} rel="noreferrer" style={{ textDecoration: "none" }} className={(props.selected) ? "selected" : ""} onClick={(e) => { e.preventDefault(); props.onClick ? props.onClick() : props.router.push(props.url) }}>{getLinkContents()}</a>)
  else return (<StyledNavLink to={props.url || "about:blank"} target={props.target} className={(props.selected) ? "selected" : ""} onClick={props.onClick ? (e) => { e.preventDefault(); props.onClick() } : null}>{getLinkContents()}</StyledNavLink>)
};
