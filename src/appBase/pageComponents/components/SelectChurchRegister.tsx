import React from "react";
import { ApiHelper } from "../../helpers"
import { ChurchInterface, RegisterChurchRequestInterface } from "../../interfaces";
import { ErrorMessages, InputBox } from "../../components"
import { Grid, InputAdornment, TextField } from "@mui/material";

interface Props {
  initialChurchName: string,
  registeredChurchCallback?: (church: ChurchInterface) => void,
  selectChurch: (churchId: string) => void,
  appName: string
}

export const SelectChurchRegister: React.FC<Props> = (props) => {
  const suggestSubDomain = (name: string) => {
    let result = name.toLowerCase().replaceAll("christian", "").replaceAll("church", "").replaceAll(" ", "");
    return result;
  }

  const [church, setChurch] = React.useState<RegisterChurchRequestInterface>({ name: props.initialChurchName, appName: props.appName, subDomain: suggestSubDomain(props.initialChurchName) });
  const [errors, setErrors] = React.useState([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const c = { ...church }
    switch (e.target.name) {
      case "name": c.name = e.target.value; break;
      case "subDomain": c.subDomain = e.target.value; break;
      case "address1": c.address1 = e.target.value; break;
      case "address2": c.address2 = e.target.value; break;
      case "city": c.city = e.target.value; break;
      case "state": c.state = e.target.value; break;
      case "zip": c.zip = e.target.value; break;
      case "country": c.country = e.target.value; break;
    }
    setChurch(c);
  }

  const validate = () => {
    let errors = [];
    if (!church.name?.trim()) errors.push("name cannot be blank.");
    if (!church.subDomain?.trim()) errors.push("Subdomain cannot be blank.");
    if (!church.address1?.trim()) errors.push("Address cannot be blank.");
    if (!church.city?.trim()) errors.push("City cannot be blank.");
    if (!church.state?.trim()) errors.push("State/Province cannot be blank.");
    if (!church.zip?.trim()) errors.push("Zip/Postal cannot be blank.");
    if (!church.country?.trim()) errors.push("Country cannot be blank.");
    setErrors(errors);
    return errors.length === 0;
  }

  const handleSave = () => {
    if (validate()) {
      setIsSubmitting(true);
      ApiHelper.post("/churches/add", church, "AccessApi").then(async resp => {
        setIsSubmitting(false);
        if (resp.errors !== undefined) setErrors(errors);
        else {
          if (props.registeredChurchCallback) props.registeredChurchCallback(resp);
          props.selectChurch(resp.id);
        }
      });
    }
  }

  return (
    <InputBox id="churchBox" saveFunction={handleSave} headerText="Register a New Church" headerIcon="church" isSubmitting={isSubmitting}>
      <ErrorMessages errors={errors} />
      <TextField fullWidth name="name" label="Church Name" value={church.name} onChange={handleChange} />
      <TextField fullWidth name="subDomain" label="Subdomain" id="subDomain" InputProps={{
        endAdornment: <InputAdornment position="end">.churchapps.org</InputAdornment>
      }} value={church.subDomain} onChange={handleChange} />
      <TextField required fullWidth name="address1" label="Address Line 1" value={church.address1} onChange={handleChange} />
      <Grid container spacing={3}>
        <Grid item xs={6}><TextField fullWidth name="address2" label="Address Line 2" value={church.address2} onChange={handleChange} /></Grid>
        <Grid item xs={6}><TextField fullWidth name="city" label="City" value={church.city} onChange={handleChange} /></Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid item xs={6}><TextField fullWidth name="state" label="State / Province" value={church.state} onChange={handleChange} /></Grid>
        <Grid item xs={6}><TextField fullWidth name="zip" label="Zip / Postal" value={church.zip} onChange={handleChange} /></Grid>
      </Grid>
      <TextField fullWidth name="country" label="Country" value={church.country} onChange={handleChange} />
    </InputBox>
  );
};

