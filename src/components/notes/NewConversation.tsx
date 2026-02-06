"use client";

import { Icon, Paper, Stack, TextField } from "@mui/material";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { ApiHelper } from "@churchapps/apphelper";
import { Locale } from "@churchapps/apphelper";
import { PersonHelper } from "@churchapps/apphelper";
import { ConversationInterface, UserContextInterface } from "@churchapps/helpers";
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

interface FormData {
  content: string;
}

export function NewConversation({ context, conversation, ...props }: Props) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = useForm<FormData>({
    defaultValues: { content: "" }
  });

  const hasConversations = conversation?.length !== 0;

  async function onSubmit(data: FormData) {
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
          allowAnonymousPosts: false,
        };
        const result = await ApiHelper.post("/conversations", [conv], "MessagingApi");
        cId = result[0].id;
      }

      const message = { content: data.content, conversationId: cId };
      await ApiHelper.post("/messages", [message], "MessagingApi");

      reset();
      props.onUpdate();
    } catch (error) {
      console.error("Error saving message:", error);
    }
  }

  const image = PersonHelper.getPhotoUrl(context?.person);

  return (
    <Paper sx={{ padding: 1, marginBottom: 2 }}>

      <Stack direction="row" spacing={1.5} style={{ marginTop: 15 }} justifyContent="end">

        {image ? <img src={image} alt="user" style={{ width: 60, height: 45, borderRadius: 5, marginLeft: 8 }} /> : <Icon>person</Icon>}
        <Stack direction="column" spacing={2} style={{ width: "100%" }} justifyContent="end">
          <div><b>{context?.person?.name?.display}</b></div>
          <Controller
            name="content"
            control={control}
            rules={{
              required: Locale.label("notes.validate.content"),
              validate: (value) => value.trim() !== "" || Locale.label("notes.validate.content")
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                aria-label={hasConversations ? "Type a message..." : Locale.label("notes.startConversation")}
                placeholder={hasConversations ? "Type a message..." : Locale.label("notes.startConversation")}
                multiline
                style={{ marginTop: 0, border: "none" }}
                variant="standard"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Stack>
        <Stack direction="column" spacing={1} justifyContent="end">
          <SmallButton icon="send" onClick={handleSubmit(onSubmit)} disabled={isSubmitting} />
        </Stack>
      </Stack>
    </Paper>
  );

};
