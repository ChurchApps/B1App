import { EventRegister } from "@/components/registration/EventRegister";
import { Theme } from "@/components/Theme";
import { DefaultPageWrapper } from "@/app/[sdSlug]/[pageSlug]/components/DefaultPageWrapper";
import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { MetaHelper } from "@/helpers/MetaHelper";
import { ApiHelper } from "@churchapps/apphelper";
import type { EventInterface } from "@churchapps/helpers";
import { Container, Typography } from "@mui/material";
import { Metadata } from "next";

type PageParams = Promise<{ sdSlug: string; eventId: string }>;

const loadSharedData = async (sdSlug: string, eventId: string) => {
  EnvironmentHelper.init();
  const config = await ConfigHelper.load(sdSlug);
  const event: EventInterface = await ApiHelper.getAnonymous("/events/public/" + config.church.id + "/" + eventId, "ContentApi");
  return { config, event };
};

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { sdSlug, eventId } = await params;
  const props = await loadSharedData(sdSlug, eventId);
  const title = props.event?.title ? "Register - " + props.event.title : "Event Registration";
  return MetaHelper.getMetaData(title, "Event Registration", undefined, props.config.appearance);
}

export default async function RegisterPage({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, eventId } = await params;
  const { config, event } = await loadSharedData(sdSlug, eventId);

  return (
    <>
      <Theme config={config} />
      <DefaultPageWrapper config={config}>
        <Container maxWidth="sm" sx={{ paddingTop: 4, paddingBottom: 4 }}>
          {event?.registrationEnabled
            ? <EventRegister churchId={config.church.id} eventId={eventId} event={event} />
            : <Typography variant="h6" sx={{ textAlign: "center", color: "text.secondary", paddingTop: 8 }}>
                Registration is not available for this event.
            </Typography>
          }
        </Container>
      </DefaultPageWrapper>
    </>
  );
}
