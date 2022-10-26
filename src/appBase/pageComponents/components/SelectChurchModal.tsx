import React from "react";
import { ChurchInterface } from "../../interfaces";
import { SelectChurchSearch } from "./SelectChurchSearch";
import { SelectableChurch } from "./SelectableChurch";
import { ErrorMessages } from "../../components"
import { Dialog, DialogContent, DialogTitle } from "@mui/material";

interface Props {
  appName: string,
  show: boolean,
  churches?: ChurchInterface[],
  selectChurch: (churchId: string) => void,
  registeredChurchCallback?: (church: ChurchInterface) => void,
  errors?: string[]
}

export const SelectChurchModal: React.FC<Props> = (props) => {
  const [showSearch, setShowSearch] = React.useState(false);

  const handleClose = () => {
    window.location.reload();
  }

  const getContents = () => {
    if (showSearch || props.churches?.length === 0) return <SelectChurchSearch selectChurch={props.selectChurch} registeredChurchCallback={props.registeredChurchCallback} appName={props.appName} />
    else return (<>
      {props.churches?.map(c => (<SelectableChurch church={c} selectChurch={props.selectChurch} key={c.id} />))}
      <a href="about:blank" style={{ color: "#999", display: "block", textAlign: "center" }} onClick={(e) => { e.preventDefault(); setShowSearch(true); }}>Choose another church</a>
    </>);
  }

  return (
    <Dialog open={props.show} onClose={handleClose}>
      <DialogTitle>Select Church</DialogTitle>
      <DialogContent sx={{ width: 500 }}>
        <ErrorMessages errors={props.errors} />
        {getContents()}
      </DialogContent>
    </Dialog>
  );
};
