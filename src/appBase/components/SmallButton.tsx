import React from "react";
import { Button, Icon, Tooltip } from "@mui/material";
import { Navigate } from "react-router-dom";

interface Props {
  ariaLabel?: string;
  text?: string;
  icon: string;
  color?: "inherit" | "primary" | "secondary" | "success" | "error" | "info" | "warning";
  toolTip?: string;
  onClick?: (e: React.MouseEvent) => void;
  href?: string;
}

export const SmallButton = React.forwardRef<HTMLDivElement, Props>((props, ref) => {
  const [redirectUrl, setRedirectUrl] = React.useState("");

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (props.href) setRedirectUrl(props.href);
    else props.onClick(e);
  }

  const style = (props.text)
    ? { backgroundColor: props.color, "& span": { marginRight: 1 } }
    : { minWidth: "auto", padding: "4px 4px" }

  if (redirectUrl) return <Navigate to={redirectUrl} />
  else return (
    <Tooltip title={props.toolTip || ""} arrow placement="top">
      <Button sx={style} variant={props.text ? "outlined" : "text"} color={props.color} aria-label={props.ariaLabel || "editButton"} onClick={handleClick} size="small">
        <Icon>{props.icon}</Icon>{(props.text) ? props.text : ""}
      </Button>
    </Tooltip>
  );
});

SmallButton.displayName = "SmallButton";
