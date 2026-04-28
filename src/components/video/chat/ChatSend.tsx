"use client";
import { ChatConfigHelper } from "@/helpers/ChatConfigHelper";
import { ChatHelper } from "@/helpers/ChatHelper";
import { Button, FormControl, InputLabel, OutlinedInput } from "@mui/material";
import React, { KeyboardEvent } from "react";
import { Emojis } from ".";
import { UserHelper, Locale } from "@churchapps/apphelper";
import { ApiHelper } from "@churchapps/apphelper";
import type { MessageInterface } from "@churchapps/helpers";
import { ChatRoomInterface } from "../../../helpers";

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
  };

  const sendMessage = () => {
    const { firstName, lastName } = ChatHelper.current.user;
    const msg: MessageInterface = { churchId: ChatConfigHelper.current.churchId, content: message.trim(), conversationId: props.room.conversation.id, displayName: `${firstName} ${lastName}`, messageType: "message" };
    if (UserHelper.user) ApiHelper.post("/messages/send", [msg], "MessagingApi");
    else ApiHelper.postAnonymous("/messages/send", [msg], "MessagingApi");
    setMessage("");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.currentTarget.value);
  };
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => { if (e.keyCode === 13) sendMessage(); };
  const toggleEmojis = (e: React.MouseEvent) => { e.preventDefault(); setShowEmojis(!showEmojis); };
  const insertEmoji = (emoji: string) => { setMessage(message + emoji); };

  const emojiContent = (showEmojis) ? <Emojis selectedFunction={insertEmoji} /> : null;

  let size:"medium" | "small" = "medium";
  if (1 === 1) size = "small"; //temp.  Need to figure out a way to determine if this is full screen or windowed and adjust accordingly.

  return (
    <div id="chatSend">
      {emojiContent}
      <div id="sendPublic" style={(size === "medium") ? { marginLeft: 5, marginRight: 5 } : {} }>

        <FormControl fullWidth variant="outlined" size={size} sx={{ marginTop: "2px", marginBottom: "1px" }}>
          <InputLabel htmlFor="searchText">{(size === "medium") ? Locale.label("video.chat.sendMessage") : Locale.label("video.chat.message")}</InputLabel>
          <OutlinedInput id="sendChatText" name="sendChatText" type="text" label={(size === "medium") ? Locale.label("video.chat.sendMessage") : Locale.label("video.chat.message")} value={message} onChange={handleChange}
            onKeyDown={handleKeyDown} autoComplete="off"
            style={(size === "small") ? { paddingRight: 4 } : {} }
            data-testid="chat-message-input"
            aria-label={Locale.label("video.chat.typeMessage")}
            endAdornment={<>
              <Button variant="outlined" size="small" style={{ paddingRight: 8, paddingLeft: 8, minWidth: 0, marginRight: 5 }} onClick={toggleEmojis} data-field="sendText" className="emojiButton" data-testid="emoji-button" aria-label={Locale.label("video.chat.openEmojiPicker")}><span role="img" aria-label={Locale.label("video.chat.emoji")}>😀</span></Button>
              <Button variant="contained" onClick={handleSendMessage} size="small" data-testid="send-message-button" aria-label={Locale.label("video.chat.sendMessageAria")}>{Locale.label("video.chat.send")}</Button>
            </>}
          />
        </FormControl>

      </div>
    </div>
  );
};

