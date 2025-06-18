"use client";

import { Dialog, DialogContent } from "@mui/material";
import React from "react";

import { PersonInterface, PrivateMessageInterface, UserContextInterface } from "@churchapps/helpers";
import { NewPrivateMessage, PrivateMessageDetails } from "@churchapps/apphelper";

interface Props {
  context: UserContextInterface;
  onBack: () => void
  person: PersonInterface
}

export const DirectMessageModal: React.FC<Props> = (props) => {
  const [selectedMessage, setSelectedMessage] = React.useState<PrivateMessageInterface>(null);

  const handleMessageSelect = (pm: PrivateMessageInterface) => {
    setSelectedMessage(pm);
  }

  return (
    <Dialog open={true} onClose={props.onBack} fullWidth scroll="body">
      <DialogContent>
        {!selectedMessage && <NewPrivateMessage context={props.context} selectedPerson={props.person} onSelectMessage={handleMessageSelect} onBack={props.onBack} />}
        {selectedMessage && <PrivateMessageDetails privateMessage={selectedMessage} context={props.context} onBack={props.onBack} refreshKey={1} />}
      </DialogContent>
    </Dialog>)

}
