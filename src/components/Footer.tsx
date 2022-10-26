import { Box, Container, Grid } from "@mui/material";

export function Footer() {
  return (
    <div id="footer">
      <Container>
        <Grid container columnSpacing={3}>
          <Grid item md={4} xs={12}>
            <img src="https://content.churchapps.org/3/settings/logoDark.png?dt=1638219047334" alt="Cedar Ridge Christian Church" />
            4010 W New Orleans St<br />
            Broken Arrow, Oklahoma 74011
          </Grid>
          <Grid item md={4} xs={12}>

          </Grid>
          <Grid item md={4} xs={12}>
            <b>Sunday service times: </b>
            <br />9:00 a.m.
            <br />10:30 a.m.
          </Grid>
        </Grid>
      </Container>
    </div>
  );
}
