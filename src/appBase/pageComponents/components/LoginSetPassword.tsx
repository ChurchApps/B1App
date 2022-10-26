import React from "react";
import { InputBox } from "../../components";
import { TextField } from "@mui/material";
import { LoginResponseInterface, UserInterface } from "../../interfaces";
import { ApiHelper } from "../../helpers";

interface Props {
  appName: string,
  appUrl: string,
  setErrors: (errors: string[]) => void,
  setShowForgot: (showForgot: boolean) => void,
  isSubmitting: boolean,
  auth: string,
  login: (data: any) => void,
}

export const LoginSetPassword: React.FC<Props> = props => {
  const [password, setPassword] = React.useState("");
  const [verifyPassword, setVerifyPassword] = React.useState("");
  const [user, setUser] = React.useState<UserInterface>(null);

  const validate = () => {
    const result = [];
    if (!password) result.push("Please enter your password.");
    else if (password.length < 8) result.push("Please enter at least an 8 character password.");
    else if (password !== verifyPassword) result.push("Passwords do not match");
    props.setErrors(result);
    return result.length === 0;
  }

  const submitChangePassword = () => {
    if (validate()) {
      submit();
    }
  }

  const loadUser = () => {
    ApiHelper.postAnonymous("/users/login", { authGuid: props.auth }, "AccessApi").then((resp: LoginResponseInterface) => {
      if (resp.user) setUser(resp.user);
      else props.setShowForgot(true);
    }).catch(() => {
      props.setShowForgot(true);
    });
  }

  const submit = async () => {
    const resp = await ApiHelper.postAnonymous("/users/setPasswordGuid", { authGuid: props.auth, newPassword: password, appName: props.appName, appUrl: props.appUrl }, "AccessApi");
    if (resp.success) props.login({ email: user.email, password });
    else props.setShowForgot(true);
  }

  React.useEffect(loadUser, []); //eslint-disable-line

  return (
    <InputBox headerText="Set Password" saveFunction={submitChangePassword} saveButtonType="submit" saveText={(props.isSubmitting || !user) ? "Please wait..." : "Sign in"} isSubmitting={props.isSubmitting}>
      {user && <p style={{ marginTop: 0, marginBottom: 0 }}>Welcome back {user.firstName}.</p>}
      <TextField fullWidth name="password" type="password" label="Set Password" value={password} onChange={(e) => { e.preventDefault(); setPassword(e.target.value) }} />
      <TextField fullWidth name="verifyPassword" type="password" label="Verify Password" value={verifyPassword} onChange={(e) => { e.preventDefault(); setVerifyPassword(e.target.value) }} />
    </InputBox>
  );
}
