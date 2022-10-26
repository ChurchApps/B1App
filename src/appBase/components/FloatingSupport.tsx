import { Fab, Icon } from "@mui/material";
import React from "react";
import { SupportModal } from "./SupportModal";

interface Props { appName?: string }

export const FloatingSupport: React.FC<Props> = (props) => {
  const [showSupport, setShowSupport] = React.useState(false);

  return (<>
    <Fab color="primary" style={{ position: "fixed", cursor: "pointer", bottom: "20px", right: (showSupport) ? 47 : 30 }} onClick={() => { setShowSupport(!showSupport) }}>
      <Icon style={{ fontSize: 40 }}>contact_support</Icon>
    </Fab>
    {showSupport && <SupportModal onClose={() => setShowSupport(false)} appName={props.appName} />}
  </>);
};
