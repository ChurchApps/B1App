import { EnvironmentHelper, StreamConfigInterface } from "@/helpers";
import { StreamingServiceHelper } from "@/helpers/StreamingServiceHelper";
import { Grid, TextField } from "@mui/material";
import React, { useEffect } from "react";
import { VideoContainer } from "./VideoContainer";

interface Props { keyName:string  }

export const LiveStream: React.FC<Props> = (props) => {
  
  const [config, setConfig] = React.useState<StreamConfigInterface>(null);
  
  const loadData = async (keyName: string) => {
    let result: StreamConfigInterface = await fetch(`${EnvironmentHelper.Common.ContentApi}/preview/data/${keyName}`).then(response => response.json());
    StreamingServiceHelper.updateServiceTimes(result);
    result.keyName = keyName;
    setConfig(result);
  }


  useEffect(() => { loadData(props.keyName); }, []);
  useEffect(() => { loadData(props.keyName); }, []);

  const currentService = StreamingServiceHelper.determineCurrentService(config?.services);

  return (
    <Grid container spacing={3}>
      <Grid item xs={9}>
        {JSON.stringify(config)}
        <VideoContainer currentService={currentService} />
      </Grid>
      <Grid item xs={3}>

      </Grid>
    </Grid>
  );
}
