"use client";

import React, { useEffect, useState } from "react";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import type { GroupInterface, GroupMemberInterface } from "@churchapps/helpers";
import { Alert, Button, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, TextField } from "@mui/material";

interface Props {
  leaders: GroupMemberInterface[];
  group: GroupInterface;
  config: ConfigurationInterface;
}

export function GroupContact(props: Props) {

  const [formData, setFormData] = useState<any>({ churchId: props.config.church.id });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const val = e.target.value;
    const fd = { ...formData }
    switch (e.target.name) {
      case "personId": fd.personId = val; break;
      case "firstName": fd.firstName = val; break;
      case "lastName": fd.lastName = val; break;
      case "email": fd.email = val; break;
      case "phone": fd.phone = val; break;
      case "message": fd.message = val; break;
    }
    setFormData(fd);
  }

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.MouseEvent) => {
    if (e !== null) e.preventDefault();
    const email = {
      churchId: formData.churchId,
      personId: formData.personId,
      appName: "B1",
      subject: "Contact Request For " + props.group.name,
      body: "First Name: " + formData.firstName + "<br />"
        + "Last Name: " + formData.lastName + "<br />"
        + "Email Address: " + formData.email + "<br />"
        + "Phone Number: " + formData.phone + "<br />"
        + "Message: " + formData.message
    }

    try {
      await ApiHelper.post("/people/public/email", email, "MembershipApi");
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error sending email:", error);
    }
  }

  const getSelectLeaders = () => {
    const result: React.ReactElement[] = [];
    props.leaders.forEach((l) => {
      result.push(<MenuItem value={l.personId} key={l.personId}>{l.person.name.display}</MenuItem>);
    });
    return result;
  }

  useEffect(() => {
    if (props.leaders?.length > 0) {
      const fd = { ...formData }
      fd.personId = props.leaders[0].personId;
      setFormData(fd);
    }
  }, [props.leaders])

  if (props.leaders?.length < 1) return <></>
  else return <>
    <div>
      <h2>Contact Group Leader:</h2>
      <form>
        {(props.leaders?.length > 1) && <FormControl fullWidth>
          <InputLabel>Contact</InputLabel>
          <Select fullWidth label="Contact" name="personId" value={formData.personId || ""} onChange={handleChange} data-testid="group-contact-select">
            {getSelectLeaders()}
          </Select>
        </FormControl>}
        <TextField fullWidth label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} data-testid="group-contact-first-name" />
        <TextField fullWidth label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} data-testid="group-contact-last-name" />
        <TextField fullWidth label="Email" name="email" value={formData.email} onChange={handleChange} data-testid="group-contact-email" />
        <TextField fullWidth label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} data-testid="group-contact-phone" />
        <TextField fullWidth label="Message" name="message" value={formData.message} onChange={handleChange} multiline data-testid="group-contact-message" />
        <Button onClick={handleSubmit} id="conbtn" style={{ height: "50px", fontWeight: "bold", width: "40%", marginBottom: "10px" }} data-testid="group-contact-submit-button">Submit</Button>
      </form>

      {isSubmitted && (
        <Alert sx={{ align: "center", fontSize: "18px", fontStyle: "italic", marginBottom: "10px" }} severity="success">
          Your message has been sent!&nbsp;
        </Alert>
      )}
    </div>
  </>
}
