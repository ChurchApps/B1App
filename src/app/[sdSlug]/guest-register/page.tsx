import { GuestRegister } from "@/components";
import { Theme } from "@/components/Theme";
import { DefaultPageWrapper } from "@/app/[sdSlug]/[pageSlug]/components/DefaultPageWrapper";
import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { MetaHelper } from "@/helpers/MetaHelper";
import { ApiHelper } from "@churchapps/apphelper";
import { Container, Typography } from "@mui/material";
import { Metadata } from "next";

type PageParams = Promise<{ sdSlug: string }>;

const loadSharedData = (sdSlug: string) => {
  EnvironmentHelper.init();
  return loadData(sdSlug);
};

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { sdSlug } = await params;
  const props = await loadSharedData(sdSlug);
  return MetaHelper.getMetaData("Guest Registration - " + props.config.church.name, "Guest Registration", undefined, undefined, props.config.appearance);
}

const loadData = async (sdSlug: string) => {
  const config = await ConfigHelper.load(sdSlug);
  const publicSettings: any = await ApiHelper.getAnonymous("/settings/public/" + config.church.id, "MembershipApi");
  const enabled = publicSettings?.enableQRGuestRegistration === "true";
  return { config, enabled };
};

export default async function GuestRegisterPage({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug } = await params;
  const { config, enabled } = await loadSharedData(sdSlug);

  return (
    <>
      <Theme config={config} />
      <DefaultPageWrapper config={config}>
        <Container maxWidth="sm" sx={{ paddingTop: 4, paddingBottom: 4 }}>
          {enabled
            ? <GuestRegister churchId={config.church.id} />
            : <Typography variant="h6" sx={{ textAlign: "center", color: "text.secondary", paddingTop: 8 }}>
                Guest registration is not enabled for this church.
            </Typography>
          }
        </Container>
      </DefaultPageWrapper>
    </>
  );
}
