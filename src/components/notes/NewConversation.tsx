"use client";

import { Icon, Paper, Stack, TextField } from "@mui/material";
import React from "react";
import { ApiHelper } from "@churchapps/apphelper";
import { Locale } from "@churchapps/apphelper";
import { PersonHelper } from "@churchapps/apphelper";
import { ConversationInterface, MessageInterface, UserContextInterface } from "@churchapps/helpers";
import { ErrorMessages } from "@churchapps/apphelper";
import { SmallButton } from "@churchapps/apphelper";

interface Props {
  contentType: string;
  contentId: string;
  groupId: string;
  visibility: "public" | "hidden";
  context: UserContextInterface;
  onUpdate: () => void;
  conversation: ConversationInterface[]
}

export function NewConversation({ context, conversation, ...props }: Props) {
  const [message, setMessage] = React.useState<MessageInterface>({});
  const [errors, setErrors] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const hasConversations = conversation?.length !== 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setErrors([]);
    const m = { ...message } as MessageInterface;
    m.content = e.target.value;
    setMessage(m);
  };

  const validate = () => {
    const result = [];
    if (!message.content.trim()) result.push(Locale.label("notes.validate.content"));
    setErrors(result);
    return result.length === 0;
  };

  async function handleSave() {
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      let cId: string;

      // If conversation exists, use the existing one
      if (hasConversations) {
        cId = conversation[0].id;
      } else {
        const conv: ConversationInterface = {
          contentType: props.contentType,
          contentId: props.contentId,
          title: `${props.contentType} ${props.contentId} Conversation`,
          groupId: props.groupId,
          visibility: props.visibility,
          allowAnonymousPosts: false
        };
        const result = await ApiHelper.post("/conversations", [conv], "MessagingApi");
        cId = result[0].id;
      }

      const m = { ...message, conversationId: cId };
      await ApiHelper.post("/messages", [m], "MessagingApi");

      setMessage({ ...message, content: "" });
      props.onUpdate();
    } catch (error) {
      console.error("Error saving message:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const image = PersonHelper.getPhotoUrl(context?.person);

  return (
    <Paper sx={{ padding: 1, marginBottom: 2 }}>
      <ErrorMessages errors={errors} />

      <Stack direction="row" spacing={1.5} style={{ marginTop: 15 }} justifyContent="end">

        {image ? <img src={image} alt="user" style={{ width: 60, height: 45, borderRadius: 5, marginLeft: 8 }} /> : <Icon>person</Icon>}
        <Stack direction="column" spacing={2} style={{ width: "100%" }} justifyContent="end">
          <div><b>{context?.person?.name?.display}</b></div>
          <TextField fullWidth name="noteText" aria-label={hasConversations ? "Type a message..." : Locale.label("notes.startConversation")} placeholder={hasConversations ? "Type a message..." : Locale.label("notes.startConversation")} multiline style={{ marginTop: 0, border: "none" }} variant="standard" onChange={handleChange} value={message.content} />
        </Stack>
        <Stack direction="column" spacing={1} justifyContent="end">
          <SmallButton icon="send" onClick={handleSave} disabled={isSubmitting} />
        </Stack>
      </Stack>
    </Paper>
  );

};
