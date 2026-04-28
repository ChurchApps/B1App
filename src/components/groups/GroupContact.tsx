"use client";

import React, { useEffect, useState } from "react";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { ApiHelper } from "@churchapps/apphelper";
import { Locale } from "@churchapps/apphelper";
import type { GroupInterface, GroupMemberInterface } from "@churchapps/helpers";
import { Alert, Button, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, TextField } from "@mui/material";

interface Props {
  leaders: GroupMemberInterface[];
  group: GroupInterface;
  config: ConfigurationInterface;
}

interface ContactFormData {
  churchId: string;
  personId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  message?: string;
}

export function GroupContact({ leaders, group, config }: Props) {
  const [formData, setFormData] = useState<ContactFormData>({ churchId: config.church.id });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    const val = e.target.value;
    const fd = { ...formData };
    switch (e.target.name) {
      case "personId": fd.personId = val; break;
      case "firstName": fd.firstName = val; break;
      case "lastName": fd.lastName = val; break;
      case "email": fd.email = val; break;
      case "phone": fd.phone = val; break;
      case "message": fd.message = val; break;
    }
    setFormData(fd);
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    if (e !== null) e.preventDefault();
    const email = {
      churchId: formData.churchId,
      personId: formData.personId,
      appName: "B1",
      subject: "Contact Request For " + group.name,
      body:
        "First Name: " + formData.firstName + "<br />"
        + "Last Name: " + formData.lastName + "<br />"
        + "Email Address: " + formData.email + "<br />"
        + "Phone Number: " + formData.phone + "<br />"
        + "Message: " + formData.message
    };

    try {
      await ApiHelper.post("/people/public/email", email, "MembershipApi");
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error sending email:", error);
    }
  };

  const getSelectLeaders = () => {
    const result: React.ReactElement[] = [];
    leaders.forEach((l) => {
      result.push(
        <MenuItem value={l.personId} key={l.personId}>
          {l.person?.name?.display}
        </MenuItem>
      );
    });
    return result;
  };

  useEffect(() => {
    if (leaders?.length > 0) {
      const fd = { ...formData };
      fd.personId = leaders[0].personId;
      setFormData(fd);
    }

  }, [leaders]);

  if (leaders?.length < 1) return <></>;
  return (
    <div>
      <h2>{Locale.label("groups.contactGroupLeader")}</h2>
      <form>
        {leaders?.length > 1 && (<FormControl fullWidth><InputLabel>{Locale.label("groups.contact")}</InputLabel><Select fullWidth label={Locale.label("groups.contact")} name="personId" value={formData.personId || ""} onChange={handleChange} data-testid="group-contact-select">{getSelectLeaders()}</Select></FormControl>)}
        <TextField fullWidth label={Locale.label("groups.firstName")} name="firstName" value={formData.firstName || ""} onChange={handleChange} aria-label={Locale.label("groups.firstNameLabel")} data-testid="group-contact-first-name-input" />
        <TextField fullWidth label={Locale.label("groups.lastName")} name="lastName" value={formData.lastName || ""} onChange={handleChange} aria-label={Locale.label("groups.lastNameLabel")} data-testid="group-contact-last-name-input" />
        <TextField fullWidth label={Locale.label("groups.email")} name="email" value={formData.email || ""} onChange={handleChange} aria-label={Locale.label("groups.emailLabel")} data-testid="group-contact-email-input" />
        <TextField fullWidth label={Locale.label("groups.phone")} name="phone" value={formData.phone || ""} onChange={handleChange} aria-label={Locale.label("groups.phoneLabel")} data-testid="group-contact-phone-input" />
        <TextField fullWidth label={Locale.label("groups.message")} name="message" value={formData.message || ""} onChange={handleChange} multiline aria-label={Locale.label("groups.messageLabel")} data-testid="group-contact-message-input" />
        <Button onClick={handleSubmit} id="conbtn" style={{ height: "50px", fontWeight: "bold", width: "40%", marginBottom: "10px" }} aria-label={Locale.label("groups.submitLabel")} data-testid="group-contact-submit-button">{Locale.label("groups.submit")}</Button>
      </form>

      {isSubmitted && (
        <Alert
          sx={{ align: "center", fontSize: "18px", fontStyle: "italic", marginBottom: "10px" }}
          severity="success"
        >
          {Locale.label("groups.messageSent")}&nbsp;
        </Alert>
      )}
    </div>
  );
}

