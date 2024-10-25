
import { ConfigHelper } from "@/helpers";
import { DonationLandingClient } from "./DonationLandingClient";

interface Props {
  params: { sdSlug: string };
}

export default async function DonationLanding({ params }: Props) {
    const {sdSlug} = await params
  const config = await ConfigHelper.load(sdSlug.toString());

  return <DonationLandingClient config={config} />;
}
