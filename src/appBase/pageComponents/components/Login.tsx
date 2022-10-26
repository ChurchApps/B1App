import React from "react";
import { InputBox } from "../../components";
import { TextField, Box } from "@mui/material";

interface Props {
  //registerCallback: () => void,
  //loginCallback: () => void
  login: (data: any) => void,
  isSubmitting: boolean,
  setShowRegister: (showRegister: boolean) => void,
  setShowForgot: (showForgot: boolean) => void,
  setErrors: (errors: string[]) => void
}

export const Login: React.FC<Props> = props => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const validateEmail = (email: string) => (/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(.\w{2,3})+$/.test(email))

  const validate = () => {
    const result = [];
    if (!email) result.push("Please enter your email address.");
    else if (!validateEmail(email)) result.push("Please enter a valid email address.");
    if (!password) result.push("Please enter your password.");
    props.setErrors(result);
    return result.length === 0;
  }

  const submitLogin = () => {
    if (validate()) props.login({ email, password });
  }

  const getRegisterLink = () => (
    <><a href="about:blank" className="text-decoration" onClick={handleShowRegister}>Register</a> &nbsp; | &nbsp; </>
  )

  const handleShowRegister = (e: React.MouseEvent) => {
    e.preventDefault();
    props.setShowRegister(true);
  }

  return (
    <InputBox headerText="Please Sign In" saveFunction={submitLogin} saveButtonType="submit" saveText={props.isSubmitting ? "Please wait..." : "Sign in"} isSubmitting={props.isSubmitting}>
      <TextField fullWidth autoFocus name="email" type="email" label="Email" value={email} onChange={(e) => { e.preventDefault(); setEmail(e.target.value) }} />
      <TextField fullWidth name="email" type="password" label="Password" value={password} onChange={(e) => { e.preventDefault(); setPassword(e.target.value) }} />
      <Box sx={{ textAlign: "right", marginY: 1 }}>
        {getRegisterLink()}
        <a href="about:blank" className="text-decoration" onClick={(e) => { e.preventDefault(); props.setShowForgot(true); }}>Forgot Password</a>&nbsp;
      </Box>
    </InputBox>
  );
}
