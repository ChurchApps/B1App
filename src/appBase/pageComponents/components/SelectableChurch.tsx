import { Grid } from "@mui/material";
import React from "react";
import { ArrayHelper } from "../../helpers"
import { ChurchInterface, GenericSettingInterface } from "../../interfaces";

interface Props {
  selectChurch: (churchId: string) => void,
  church: ChurchInterface
}

export const SelectableChurch: React.FC<Props> = (props) => {

  let logo = "/images/logo.png";
  if (props.church.settings) {
    let l: GenericSettingInterface = ArrayHelper.getOne(props.church.settings, "keyName", "logoLight");
    if (l?.value) logo = l.value;
  }
  return (
    <Grid container spacing={3}>
      <Grid item md={6} xs={12}>
        <a href="about:blank" style={{ fontSize: "1.125rem", display: "block", marginTop: 15, marginBottom: 15 }} onClick={(e) => { e.preventDefault(); props.selectChurch(props.church.id) }}>
          <img src={logo} alt="church logo" className="w-100" />
        </a>
      </Grid>
      <Grid item md={6} xs={12}>
        <div>
          <a href="about:blank" style={{ fontSize: "1.125rem", display: "block" }} onClick={(e) => { e.preventDefault(); props.selectChurch(props.church.id) }}>{props.church.name}</a>
          {(props.church.address1) && <div>{props.church.address1}</div>}
          {(props.church.city || props.church.state) && <div>
            {props.church.city && props.church.city + ", "}
            {props.church.state}
          </div>}
        </div>
      </Grid>
      <span style={{ display: "block", width: "100%", borderTop: "1px solid #ccc", margin: "1rem" }}></span>
    </Grid>
  );
};
