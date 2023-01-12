import { useState } from "react";
import Link from "next/link";
import { Grid } from "@mui/material";
import { Wrapper, Household, CheckinComplete, Services } from "@/components";
import { ConfigHelper, UserHelper, WrapperPageProps } from "@/helpers";
import { GetStaticPaths, GetStaticProps } from "next";

export default function Checkin(props: WrapperPageProps) {
  const [currentStep, setCurrentStep] = useState<"household" | "complete">();

  let content = null;
  switch (currentStep) {
    case "household":
      content = <Household completeHandler={() => setCurrentStep("complete")} />;
      break;
    case "complete":
      content = <CheckinComplete />;
      break;
    default:
      content = <Services selectedHandler={() => setCurrentStep("household")} />;
      break;
  }

  return (
    <Wrapper config={props.config}>
      {UserHelper.user?.firstName ? (
        <Grid container spacing={3}>
          <Grid item md={8} xs={12}>
            {content}
          </Grid>
        </Grid>
      ) : (
        <h3 className="text-center w-100">
          Please <Link href="/login/?returnUrl=/member/checkin">Login</Link> to checkin.
        </h3>
      )}
    </Wrapper>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = [];
  return { paths, fallback: "blocking", };
};
;

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const config = await ConfigHelper.load(params.sdSlug.toString());
  return {
    props: { config },
    revalidate: 30,
  };
};
