import { Theme } from "@/components";
import { DefaultPageWrapper } from "@/app/[sdSlug]/[pageSlug]/components/DefaultPageWrapper";
import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { MetaHelper } from "@/helpers/MetaHelper";
import { ApiHelper } from "@churchapps/apphelper";
import { Container, Typography } from "@mui/material";
import { Metadata } from "next";
import { VolunteerSignup } from "@/components/serving/VolunteerSignup";

type PageParams = Promise<{ sdSlug: string; planId: string }>;

const loadSharedData = async (sdSlug: string, planId: string) => {
  EnvironmentHelper.init();
  const config = await ConfigHelper.load(sdSlug);
  const signupPlans = await ApiHelper.getAnonymous("/plans/public/signup/" + config.church.id, "DoingApi");
  const planData = (signupPlans || []).find((sp: any) => sp.plan.id === planId);
  return { config, planData };
};

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { sdSlug, planId } = await params;
  const { config, planData } = await loadSharedData(sdSlug, planId);
  const title = planData ? "Volunteer - " + planData.plan.name : "Volunteer";
  return MetaHelper.getMetaData(title + " - " + config.church.name, "Sign up to volunteer", undefined, undefined, config.appearance);
}

export default async function VolunteerPlanPage({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, planId } = await params;
  const { config, planData } = await loadSharedData(sdSlug, planId);

  return (
    <>
      <Theme config={config} />
      <DefaultPageWrapper config={config}>
        <Container maxWidth="md" sx={{ paddingTop: 4, paddingBottom: 4 }}>
          {planData
            ? <VolunteerSignup planData={planData} churchId={config.church.id} />
            : <Typography variant="h6" sx={{ textAlign: "center", color: "text.secondary", paddingTop: 8 }}>
                No volunteer positions are currently available for this plan.
              </Typography>
          }
        </Container>
      </DefaultPageWrapper>
    </>
  );
}
