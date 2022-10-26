import React, { FormEventHandler } from "react";
import { ApiHelper } from "../../helpers";
import { ErrorMessages } from "../../components";
import { ResetPasswordRequestInterface, ResetPasswordResponseInterface } from "../../interfaces";
import { Stack, TextField, Box, Typography } from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";

interface Props {
  registerCallback: () => void,
  loginCallback: () => void
}

export const Forgot: React.FC<Props> = props => {
  const [errors, setErrors] = React.useState([]);
  const [successMessage, setSuccessMessage] = React.useState<React.ReactElement>(null);
  const [email, setEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setEmail(e.target.value);
  }

  const validateEmail = (email: string) => (/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(.\w{2,3})+$/.test(email))

  const validate = () => {
    const result = [];
    if (!email) result.push("Please enter your email address.");
    else if (!validateEmail(email)) result.push("Please enter a valid email address.");
    setErrors(result);
    return result.length === 0;
  }

  const reset: FormEventHandler = (e) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      let req: ResetPasswordRequestInterface = { userEmail: email };
      ApiHelper.postAnonymous("/users/forgot", req, "AccessApi").then((resp: ResetPasswordResponseInterface) => {
        if (resp.emailed) {
          setErrors([]);
          setSuccessMessage(
            <Typography textAlign="center" marginTop="35px">
              Password reset email sent! <br /><br /><a href="about:blank" className="text-decoration" onClick={(e) => { e.preventDefault(); props.loginCallback(); }}>Go to Login</a>
            </Typography>
          );
          setEmail("");
        } else {
          setErrors(["We could not find an account with this email address"]);
          setSuccessMessage(<></>);
        }
      }).finally(() => { setIsSubmitting(false); });
    }
  }

  return (
    <Box id="loginBox" sx={{ backgroundColor: "#FFF", border: "1px solid #CCC", borderRadius: "5px", padding: "20px" }}>
      <Typography component="h2" sx={{ fontSize: "32px", fontWeight: 500, lineHeight: 1.2, margin: "0 0 8px 0" }}>Reset Password</Typography>

      <form onSubmit={reset}>
        <p>Enter your email address to request a password reset.</p>
        <ErrorMessages errors={errors} />
        {successMessage}
        {!successMessage && (
          <>
            <TextField fullWidth autoFocus label="Email" aria-label="email" id="email" name="email" value={email} onChange={handleChange} placeholder="Email address" onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && reset} />
            <br />
            <Box sx={{ textAlign: "right", marginY: 1 }}>
              <a href="about:blank" className="text-decoration" onClick={(e) => { e.preventDefault(); props.registerCallback(); }}>Register</a> &nbsp; | &nbsp;
              <a href="about:blank" className="text-decoration" onClick={(e) => { e.preventDefault(); props.loginCallback(); }}>Login</a>&nbsp;
            </Box>
            <Stack direction="row" sx={{ marginTop: 1.5 }} spacing={1} justifyContent="flex-end">
              <LoadingButton loading={isSubmitting} variant="contained" type="submit" disabled={isSubmitting}>Reset</LoadingButton>
            </Stack>
          </>
        )}
      </form>
    </Box>
  );
}
