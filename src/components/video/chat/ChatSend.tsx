import { ChatConfigHelper } from "@/helpers/ChatConfigHelper";
import { ChatHelper } from "@/helpers/ChatHelper";
import { Button, FormControl, InputLabel, OutlinedInput } from "@mui/material";
import React, { KeyboardEvent } from "react";
import { Emojis } from ".";
import { UserHelper } from "../../../appBase/helpers";
import { ApiHelper, ChatRoomInterface, MessageInterface } from "../../../helpers"

interface Props { room: ChatRoomInterface }

export const ChatSend: React.FC<Props> = (props) => {
  const [message, setMessage] = React.useState("");
  const [showEmojis, setShowEmojis] = React.useState(false);

  const handleSendMessage = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setMessage("");
      return;
    }
    sendMessage();
  }

  const sendMessage = () => {
    const { firstName, lastName } = ChatHelper.current.user;
    const msg: MessageInterface = { churchId: ChatConfigHelper.current.churchId, content: message.trim(), conversationId: props.room.conversation.id, displayName: `${firstName} ${lastName}`, messageType: "message" }
    if (UserHelper.user) ApiHelper.post("/messages/send", [msg], "MessagingApi");
    else ApiHelper.postAnonymous("/messages/send", [msg], "MessagingApi");
    setMessage("");
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.currentTarget.value);
  }
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => { if (e.keyCode === 13) sendMessage(); }
  const toggleEmojis = (e: React.MouseEvent) => { e.preventDefault(); setShowEmojis(!showEmojis); }
  const insertEmoji = (emoji: string) => { setMessage(message + emoji); }

  let emojiContent = (showEmojis) ? <Emojis selectedFunction={insertEmoji} /> : null;

  return (
    <div id="chatSend">
      {emojiContent}
      <div id="sendPublic" style={{ marginLeft: 5, marginRight: 5 }}>

        <FormControl fullWidth variant="outlined">
          <InputLabel htmlFor="searchText">Send Message</InputLabel>
          <OutlinedInput id="sendChatText" name="sendChatText" type="text" label="Send Message" value={message} onChange={handleChange}
            onKeyDown={handleKeyDown} autoComplete="off"
            endAdornment={<>
              <Button variant="outlined" size="small" style={{ paddingRight: 8, paddingLeft: 8, minWidth: 0, marginRight: 5 }} onClick={toggleEmojis} data-field="sendText" className="emojiButton"><span role="img" aria-label="emoji">😀</span></Button>
              <Button variant="contained" onClick={handleSendMessage}>Send</Button>
            </>}
          />
        </FormControl>

      </div>
    </div>
  );
}

