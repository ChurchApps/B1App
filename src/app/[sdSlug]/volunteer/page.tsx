import { Theme } from "@/components";
import { DefaultPageWrapper } from "@/app/[sdSlug]/[pageSlug]/components/DefaultPageWrapper";
import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { MetaHelper } from "@/helpers/MetaHelper";
import { ApiHelper } from "@churchapps/apphelper";
import { Container } from "@mui/material";
import { Metadata } from "next";
import { VolunteerBrowse } from "@/components/serving/VolunteerBrowse";

type PageParams = Promise<{ sdSlug: string }>;

const loadSharedData = async (sdSlug: string) => {
  EnvironmentHelper.init();
  const config = await ConfigHelper.load(sdSlug);
  const signupPlans = await ApiHelper.getAnonymous("/plans/public/signup/" + config.church.id, "DoingApi");
  return { config, signupPlans };
};

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { sdSlug } = await params;
  const { config } = await loadSharedData(sdSlug);
  return MetaHelper.getMetaData("Volunteer Opportunities - " + config.church.name, "Browse open volunteer positions", undefined, undefined, config.appearance);
}

export default async function VolunteerPage({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug } = await params;
  const { config, signupPlans } = await loadSharedData(sdSlug);

  return (
    <>
      <Theme config={config} />
      <DefaultPageWrapper config={config}>
        <Container maxWidth="md" sx={{ paddingTop: 4, paddingBottom: 4 }}>
          <VolunteerBrowse signupPlans={signupPlans || []} />
        </Container>
      </DefaultPageWrapper>
    </>
  );
}
