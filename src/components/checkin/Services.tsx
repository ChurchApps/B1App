"use client"
import { useState, useEffect } from "react";
import { CheckinHelper, PersonHelper } from "@/helpers";
import { Loading } from "@churchapps/apphelper";
import { ApiHelper } from "@churchapps/apphelper";
import { ArrayHelper } from "@churchapps/apphelper";
import { Box, CardActionArea, Icon, Typography, CircularProgress } from "@mui/material";
import { HeaderSection, HeaderIconContainer, CheckinCard, IconCircle, EmptyStateCard, colors } from "./CheckinStyles";
import type { ServiceInterface, GroupServiceTimeInterface, GroupInterface, ServiceTimeInterface, PersonInterface } from "@churchapps/helpers";

interface Props {
  selectedHandler: () => void;
}

export function Services({ selectedHandler }: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [services, setServices] = useState<ServiceInterface[]>([]);
  const [selectingServiceId, setSelectingServiceId] = useState<string>("");

  const loadData = () => {
    setIsLoading(true);
    ApiHelper.get("/services", "AttendanceApi").then((data: ServiceInterface[]) => {
      setServices(data);
      setIsLoading(false);
    });
  };

  const selectService = async (serviceId: string) => {
    setSelectingServiceId(serviceId);

    const promises: Promise<void>[] = [
      ApiHelper.get("/servicetimes?serviceId=" + serviceId, "AttendanceApi").then((times: ServiceTimeInterface[]) => {
        CheckinHelper.serviceId = serviceId;
        CheckinHelper.serviceTimes = times;
      }),
      ApiHelper.get("/groupservicetimes", "AttendanceApi").then((groupServiceTimes: GroupServiceTimeInterface[]) => {
        CheckinHelper.groupServiceTimes = groupServiceTimes;
      }),
      ApiHelper.get("/groups", "MembershipApi").then((groups: GroupInterface[]) => {
        CheckinHelper.groups = groups;
      }),
      ApiHelper.get("/people/household/" + PersonHelper.person.householdId, "MembershipApi").then((members: PersonInterface[]) => {
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
      <HeaderSection>
        <HeaderIconContainer>
          <Icon sx={{ fontSize: 48, color: colors.primary }}>event</Icon>
        </HeaderIconContainer>
        <Typography variant="h4" sx={{ color: colors.textPrimary, fontWeight: 700, marginBottom: 1 }}>
          Select Service
        </Typography>
        <Typography variant="body1" sx={{ color: colors.textSecondary }}>
          Choose which service you're checking in for
        </Typography>
      </HeaderSection>

      {/* Services List */}
      {services.length === 0
        ? (
          <EmptyStateCard>
            <Icon sx={{ fontSize: 64, color: colors.textSecondary }}>event_busy</Icon>
            <Typography variant="h6" sx={{ color: colors.textPrimary, fontWeight: 600, marginTop: 2, marginBottom: 1 }}>
              No Services Available
            </Typography>
            <Typography variant="body2" sx={{ color: colors.textSecondary }}>
              Please check back later or contact your church administrator
            </Typography>
          </EmptyStateCard>
        )
        : (
        services.map((service) => (
          <CheckinCard key={service.id}>
            <CardActionArea
              onClick={() => selectService(service.id)}
              data-testid={`select-service-${service.id}-button`}
              sx={{ padding: 2, minHeight: 72 }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <IconCircle sx={{ marginRight: 2 }}>
                  <Icon sx={{ fontSize: 28, color: colors.primary }}>church</Icon>
                </IconCircle>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ color: colors.textPrimary, fontWeight: 600, marginBottom: 0.5 }}>
                    {service.name}
                  </Typography>
                  {service.campus?.name && (
                    <Typography variant="body2" sx={{ color: colors.primary, fontWeight: 500 }}>
                      {service.campus.name}
                    </Typography>
                  )}
                </Box>
                {selectingServiceId === service.id
                  ? (
                    <CircularProgress size={24} />
                  )
                  : (
                    <Icon sx={{ color: colors.textSecondary }}>chevron_right</Icon>
                  )}
              </Box>
            </CardActionArea>
          </CheckinCard>
        ))
      )}
    </>
  );
}
