"use client"
import { useState, useEffect } from "react";
import { CheckinHelper, PersonHelper } from "@/helpers";
import { Loading } from "@churchapps/apphelper";
import { ApiHelper } from "@churchapps/apphelper";
import { ArrayHelper } from "@churchapps/apphelper";
import { Box, Card, CardActionArea, Icon, Typography, CircularProgress } from "@mui/material";
import type { ServiceInterface, GroupServiceTimeInterface, GroupInterface } from "@churchapps/helpers";

interface Props {
  selectedHandler: () => void;
}

export function Services({ selectedHandler }: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [services, setServices] = useState<ServiceInterface[]>([]);
  const [selectingServiceId, setSelectingServiceId] = useState<string>("");

  const loadData = () => {
    setIsLoading(true);
    ApiHelper.get("/services", "AttendanceApi").then((data: any) => {
      setServices(data);
      setIsLoading(false);
    });
  };

  const selectService = async (serviceId: string) => {
    setSelectingServiceId(serviceId);

    const promises: Promise<any>[] = [
      ApiHelper.get("/servicetimes?serviceId=" + serviceId, "AttendanceApi").then((times: any) => {
        CheckinHelper.serviceId = serviceId;
        CheckinHelper.serviceTimes = times;
      }),
      ApiHelper.get("/groupservicetimes", "AttendanceApi").then((groupServiceTimes: any) => {
        CheckinHelper.groupServiceTimes = groupServiceTimes;
      }),
      ApiHelper.get("/groups", "MembershipApi").then((groups: any) => {
        CheckinHelper.groups = groups;
      }),
      ApiHelper.get("/people/household/" + PersonHelper.person.householdId, "MembershipApi").then((members: any) => {
        CheckinHelper.householdMembers = members;
      }),
    ];
    await Promise.all(promises);
    const peopleIds: number[] = ArrayHelper.getUniqueValues(CheckinHelper.householdMembers, "id");
    const url
      = "/visits/checkin?serviceId="
      + CheckinHelper.serviceId
      + "&peopleIds="
      + encodeURIComponent(peopleIds.join(","))
      + "&include=visitSessions";
    CheckinHelper.existingVisits = await ApiHelper.get(url, "AttendanceApi");
    CheckinHelper.pendingVisits = [...CheckinHelper.existingVisits];

    //for simplicity, iterate the group service times and add groups to the services.
    CheckinHelper.serviceTimes.forEach((st) => {
      st.groups = [];
      ArrayHelper.getAll(CheckinHelper.groupServiceTimes, "serviceTimeId", st.id).forEach(
        (gst: GroupServiceTimeInterface) => {
          const g: GroupInterface = ArrayHelper.getOne(CheckinHelper.groups, "id", gst.groupId);
          st.groups?.push(g);
        }
      );
    });

    setSelectingServiceId("");
    selectedHandler();
  };

  useEffect(loadData, []);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      {/* Header Section */}
      <Box
        sx={{
          backgroundColor: "#FFFFFF",
          padding: 3,
          textAlign: "center",
          borderRadius: 2,
          marginBottom: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: "#F6F6F8",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            margin: "0 auto 16px",
          }}
        >
          <Icon sx={{ fontSize: 48, color: "#0D47A1" }}>event</Icon>
        </Box>
        <Typography variant="h4" sx={{ color: "#3c3c3c", fontWeight: 700, marginBottom: 1 }}>
          Select Service
        </Typography>
        <Typography variant="body1" sx={{ color: "#9E9E9E" }}>
          Choose which service you're checking in for
        </Typography>
      </Box>

      {/* Services List */}
      {services.length === 0 ? (
        <Card sx={{ borderRadius: 3, padding: 4, textAlign: "center" }}>
          <Icon sx={{ fontSize: 64, color: "#9E9E9E" }}>event_busy</Icon>
          <Typography variant="h6" sx={{ color: "#3c3c3c", fontWeight: 600, marginTop: 2, marginBottom: 1 }}>
            No Services Available
          </Typography>
          <Typography variant="body2" sx={{ color: "#9E9E9E" }}>
            Please check back later or contact your church administrator
          </Typography>
        </Card>
      ) : (
        services.map((service) => (
          <Card
            key={service.id}
            sx={{
              borderRadius: 3,
              marginBottom: 1.5,
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            <CardActionArea
              onClick={() => selectService(service.id)}
              data-testid={`select-service-${service.id}-button`}
              sx={{ padding: 2, minHeight: 72 }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    backgroundColor: "#F6F6F8",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 2,
                  }}
                >
                  <Icon sx={{ fontSize: 28, color: "#0D47A1" }}>church</Icon>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ color: "#3c3c3c", fontWeight: 600, marginBottom: 0.5 }}>
                    {service.name}
                  </Typography>
                  {service.campus?.name && (
                    <Typography variant="body2" sx={{ color: "#0D47A1", fontWeight: 500 }}>
                      {service.campus.name}
                    </Typography>
                  )}
                </Box>
                {selectingServiceId === service.id ? (
                  <CircularProgress size={24} />
                ) : (
                  <Icon sx={{ color: "#9E9E9E" }}>chevron_right</Icon>
                )}
              </Box>
            </CardActionArea>
          </Card>
        ))
      )}
    </>
  );
}
