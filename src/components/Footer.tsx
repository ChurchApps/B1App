import type { ChurchInterface } from "@churchapps/helpers";
import { Container, Grid } from "@mui/material";


type Props = {
  church: ChurchInterface;
  churchSettings: any;
};

export function Footer(props: Props) {
  return (
    <div id="footer">
      <Container>
        <Grid container columnSpacing={3}>
          <Grid size={{ md: 4, xs: 12 }}>
            <img src={props.churchSettings.logoDark} alt={props.church.name} />
            4010 W New Orleans St<br />
            Broken Arrow, Oklahoma 74011
          </Grid>
          <Grid size={{ md: 4, xs: 12 }}>

          </Grid>
          <Grid size={{ md: 4, xs: 12 }}>
            <b>Sunday service times: </b>
            <br />9:00 a.m.
            <br />10:30 a.m.
          </Grid>
        </Grid>
      </Container>
    </div>
  );
}
