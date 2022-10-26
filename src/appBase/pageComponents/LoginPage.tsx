import * as React from "react";
import { ErrorMessages, FloatingSupport, Loading } from "../components";
import { LoginResponseInterface, UserContextInterface, ChurchInterface, UserInterface } from "../interfaces";
import { ApiHelper, ArrayHelper, UserHelper } from "../helpers";
import { useCookies } from "react-cookie"
import jwt_decode from "jwt-decode"
import { Register } from "./components/Register"
import { SelectChurchModal } from "./components/SelectChurchModal"
import { Forgot } from "./components/Forgot";
import { Alert, Box, Typography } from "@mui/material";
import { Login } from "./components/Login";
import { LoginSetPassword } from "./components/LoginSetPassword";

interface Props {
  context: UserContextInterface,
  jwt: string,
  auth: string,
  keyName?: string,
  logo?: string,
  appName?: string,
  appUrl?: string,
  returnUrl?: string,
  loginSuccessOverride?: () => void,
  userRegisteredCallback?: (user: UserInterface) => Promise<void>;
  churchRegisteredCallback?: (church: ChurchInterface) => Promise<void>;
  callbackErrors?: string[];
}

export const LoginPage: React.FC<Props> = (props) => {
  const [welcomeBackName, setWelcomeBackName] = React.useState("");
  const [pendingAutoLogin, setPendingAutoLogin] = React.useState(false);
  const [errors, setErrors] = React.useState([]);
  const [cookies, setCookie] = useCookies(["jwt", "name", "email"]);
  const [showForgot, setShowForgot] = React.useState(false);
  const [showRegister, setShowRegister] = React.useState(false);
  const [showSelectModal, setShowSelectModal] = React.useState(false);
  const [loginResponse, setLoginResponse] = React.useState<LoginResponseInterface>(null)
  const [userJwt, setUserJwt] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const loginFormRef = React.useRef(null);
  const location = typeof window !== "undefined" && window.location;
  let selectedChurchId = "";
  let registeredChurch: ChurchInterface = null;
  let userJwtBackup = ""; //use state copy for storing between page updates.  This copy for instant availability.

  const cleanAppUrl = () => {
    if (!props.appUrl) return null;
    else {
      const index = props.appUrl.indexOf("/", 9);
      if (index === -1) return props.appUrl;
      else return props.appUrl.substring(0, index);
    }
  }

  React.useEffect(() => {
    if (props.callbackErrors?.length > 0) {
      setErrors(props.callbackErrors)
    }
  }, [props.callbackErrors])

  const init = () => {
    const search = new URLSearchParams(location?.search);
    const action = search.get("action");
    if (action === "forgot") setShowForgot(true);
    else if (action === "register") setShowRegister(true);
    else {
      if (props.jwt) {
        setWelcomeBackName(cookies.name);
        login({ jwt: props.jwt });
      } else {
        setPendingAutoLogin(true);
      }
    }
  };

  const handleLoginSuccess = async (resp: LoginResponseInterface) => {
    userJwtBackup = resp.user.jwt;
    setUserJwt(userJwtBackup);
    ApiHelper.setDefaultPermissions(resp.user.jwt);
    setLoginResponse(resp)
    resp.churches.forEach(church => { if (!church.apis) church.apis = []; });
    UserHelper.churches = resp.churches;

    setCookie("name", `${resp.user.firstName} ${resp.user.lastName}`, { path: "/" });
    setCookie("email", resp.user.email, { path: "/" });
    UserHelper.user = resp.user;

    if (props.jwt) {
      const decoded: any = jwt_decode(userJwtBackup)
      selectedChurchId = decoded.churchId
    }

    const search = new URLSearchParams(location?.search);
    const churchIdInParams = search.get("churchId");

    if (props.keyName) selectChurchByKeyName();
    else if (selectedChurchId) selectChurchById();
    else if (churchIdInParams) selectChurch(churchIdInParams);
    else setShowSelectModal(true);
  }

  const selectChurchById = async () => {
    await UserHelper.selectChurch(props.context, selectedChurchId, undefined);
    if (props.churchRegisteredCallback && registeredChurch) {
      await props.churchRegisteredCallback(registeredChurch)
      registeredChurch = null;
      login({ jwt: userJwt || userJwtBackup });
    } else await continueLoginProcess();
  }

  const selectChurchByKeyName = async () => {
    if (!ArrayHelper.getOne(UserHelper.churches, "subDomain", props.keyName)) {
      const church: ChurchInterface = await ApiHelper.post("/churches/select", { subDomain: props.keyName }, "AccessApi");
      UserHelper.setupApiHelper(church);
      //create/claim the person record and relogin
      const personClaim = await ApiHelper.get("/people/claim/" + church.id, "MembershipApi");
      await ApiHelper.post("/userChurch/claim", { encodedPerson: personClaim.encodedPerson }, "AccessApi");
      login({ jwt: userJwt || userJwtBackup });
      return;
    }
    await UserHelper.selectChurch(props.context, undefined, props.keyName);
    await continueLoginProcess()
    return;
  }

  async function continueLoginProcess() {
    if (UserHelper.currentChurch) {
      UserHelper.currentChurch.apis.forEach(api => {
        if (api.keyName === "AccessApi") setCookie("jwt", api.jwt, { path: "/" });
      })
      try {
        if (UserHelper.currentChurch.id) ApiHelper.patch(`/userChurch/${UserHelper.user.id}`, { churchId: UserHelper.currentChurch.id, appName: props.appName, lastAccessed: new Date() }, "AccessApi")
      } catch (e) {
        console.log("Could not update user church accessed date")
      }
    }

    if (props.loginSuccessOverride !== undefined) props.loginSuccessOverride();
    else {
      props.context.setUser(UserHelper.user);
      props.context.setChurches(UserHelper.churches)
      props.context.setChurch(UserHelper.currentChurch)
      try {
        const p = await ApiHelper.get(`/people/${UserHelper.currentChurch.personId}`, "MembershipApi");
        if (p) props.context.setPerson(p);
      } catch {
        console.log("claiming person");
        const personClaim = await ApiHelper.get("/people/claim/" + UserHelper.currentChurch.id, "MembershipApi");
        await ApiHelper.post("/userChurch/claim", { encodedPerson: personClaim.encodedPerson }, "AccessApi");
        props.context.setPerson(personClaim);
      }
    }
  }

  async function selectChurch(churchId: string) {
    try {
      setErrors([])
      selectedChurchId = churchId;
      if (!ArrayHelper.getOne(UserHelper.churches, "id", churchId)) {
        const church: ChurchInterface = await ApiHelper.post("/churches/select", { churchId: churchId }, "AccessApi");
        UserHelper.setupApiHelper(church);

        //create/claim the person record and relogin
        const personClaim = await ApiHelper.get("/people/claim/" + churchId, "MembershipApi");
        await ApiHelper.post("/userChurch/claim", { encodedPerson: personClaim.encodedPerson }, "AccessApi");
        login({ jwt: userJwt || userJwtBackup });
        return;
      }
      UserHelper.selectChurch(props.context, churchId, null).then(() => { continueLoginProcess() });
    } catch (err) {
      console.log("Error in selecting church: ", err)
      setErrors(["Error in selecting church. Please verify and try again"])
      loginFormRef?.current?.setSubmitting(false);
    }

  }

  const handleLoginErrors = (errors: string[]) => {
    setWelcomeBackName("");
    console.log(errors);
    setErrors(["Invalid login. Please check your email or password."]);
  }

  const login = async (data: any) => {
    setErrors([])
    setIsSubmitting(true);
    try {
      const resp: LoginResponseInterface = await ApiHelper.postAnonymous("/users/login", data, "AccessApi");
      setIsSubmitting(false);
      handleLoginSuccess(resp);
    } catch (e: any) {
      setPendingAutoLogin(true);
      handleLoginErrors([e.toString()]);
      setIsSubmitting(false);
    }
  };

  const getWelcomeBack = () => { if (welcomeBackName !== "") return (<><Alert severity="info">Welcome back, <b>{welcomeBackName}</b>!  Please wait while we load your data.</Alert><Loading /></>); }
  const getCheckEmail = () => { if (new URLSearchParams(location?.search).get("checkEmail") === "1") return <Alert severity="info"> Thank you for registering.  Please check your email to continue.</Alert> }
  const handleRegisterCallback = () => { setShowForgot(false); setShowRegister(true); }
  const handleLoginCallback = () => { setShowForgot(false); setShowRegister(false); }
  const handleChurchRegistered = (church: ChurchInterface) => { registeredChurch = church; }

  const getInputBox = () => {
    if (showRegister) return (
      <Box id="loginBox" sx={{ backgroundColor: "#FFF", border: "1px solid #CCC", borderRadius: "5px", padding: "20px" }}>
        <Typography component="h2" sx={{ fontSize: "32px", fontWeight: 500, lineHeight: 1.2, margin: "0 0 8px 0" }}>Create an Account</Typography>
        <Register updateErrors={setErrors} appName={props.appName} appUrl={cleanAppUrl()} loginCallback={handleLoginCallback} userRegisteredCallback={props.userRegisteredCallback} />
      </Box>
    );
    else if (showForgot) return (<Forgot registerCallback={handleRegisterCallback} loginCallback={handleLoginCallback} />);
    else if (props.auth) return (<LoginSetPassword setErrors={setErrors} setShowForgot={setShowForgot} isSubmitting={isSubmitting} auth={props.auth} login={login} appName={props.appName} appUrl={cleanAppUrl()} />)
    else return <Login setShowRegister={setShowRegister} setShowForgot={setShowForgot} setErrors={setErrors} isSubmitting={isSubmitting} login={login} />;
  }

  React.useEffect(init, []); //eslint-disable-line

  return (
    <Box sx={{ maxWidth: "382px" }} px="16px" mx="auto">
      <img src={props.logo || "/images/logo-login.png"} alt="logo" style={{ width: "100%", marginTop: 100, marginBottom: 60 }} />
      <ErrorMessages errors={errors} />
      {getWelcomeBack()}
      {getCheckEmail()}
      {pendingAutoLogin && getInputBox()}
      <SelectChurchModal show={showSelectModal} churches={loginResponse?.churches} selectChurch={selectChurch} registeredChurchCallback={handleChurchRegistered} errors={errors} appName={props.appName} />
      <FloatingSupport appName={props.appName} />
    </Box>
  );

};
