import { Icon } from "@mui/material";
import React from "react";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import { DateHelper } from "@churchapps/apphelper/dist/helpers/DateHelper";
import { UserHelper } from "@churchapps/apphelper/dist/helpers/UserHelper";
import { DisplayBox } from "@churchapps/apphelper/dist/components/DisplayBox";
import { Loading } from "@churchapps/apphelper/dist/components/Loading";
import { SmallButton } from "@churchapps/apphelper/dist/components/SmallButton";
import type { StreamingServiceInterface } from "@churchapps/helpers";
import { ServiceEdit } from "./ServiceEdit";

export const Services: React.FC = () => {
  const [services, setServices] = React.useState<StreamingServiceInterface[]>([]);
  const [currentService, setCurrentService] = React.useState<StreamingServiceInterface>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const handleUpdated = () => { setCurrentService(null); loadData(); }
  const getEditContent = () => <SmallButton icon="add" text="Add" onClick={handleAdd} data-testid="add-service-button" />
  const loadData = () => {
    ApiHelper.get("/streamingServices", "ContentApi").then(data => {
      data.forEach((s: StreamingServiceInterface) => {
        s.serviceTime = new Date(Date.parse(s.serviceTime.toString()));
        s.serviceTime.setMinutes(s.serviceTime.getMinutes() + s.timezoneOffset);
      })
      setServices(data);
      setIsLoading(false);
    });
  }

  const handleAdd = () => {
    let tz = new Date().getTimezoneOffset();
    let defaultDate = getNextSunday();
    //defaultDate.setTime(defaultDate.getTime() + (9 * 60 * 60 * 1000) - (tz * 60 * 1000));
    defaultDate.setTime(defaultDate.getTime() + (9 * 60 * 60 * 1000));

    let link: StreamingServiceInterface = { churchId: UserHelper.currentUserChurch.church.id, serviceTime: defaultDate, chatBefore: 600, chatAfter: 600, duration: 3600, earlyStart: 600, provider: "youtube_live", providerKey: "", recurring: false, timezoneOffset: tz, videoUrl: "", label: "Sunday Morning", sermonId: "latest" }
    setCurrentService(link);
    loadData();
  }

  const getNextSunday = () => {
    let result = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
    while (result.getDay() !== 0) result.setDate(result.getDate() + 1);
    return result;
  }

  const getRows = () => {
    //var idx = 0;
    let rows: React.ReactElement[] = [];
    services.forEach(service => {
      rows.push(
        <tr key={service.id}>
          <td>{service.label}</td>
          <td>{DateHelper.prettyDateTime(service.serviceTime)}</td>
          <td style={{ textAlign: "right" }}>
            <a href="about:blank" onClick={(e: React.MouseEvent) => { e.preventDefault(); setCurrentService(service); }}><Icon>edit</Icon></a>
          </td>
        </tr>
      );
      //idx++;
    })
    return rows;
  }

  const getTable = () => {
    if (isLoading) return <Loading />
    else return (<table className="table">
      <tbody>
        {getRows()}
      </tbody>
    </table>);
  }

  React.useEffect(() => { loadData(); }, []);

  if (currentService !== null) return <ServiceEdit currentService={currentService} updatedFunction={handleUpdated} />;
  else return (
    <DisplayBox headerIcon="calendar_month" headerText="Services" editContent={getEditContent()} id="servicesBox" data-testid="services-display-box">
      {getTable()}
    </DisplayBox>
  );

}
