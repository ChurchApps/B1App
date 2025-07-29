"use client";

import { useState } from "react";
import Link from "next/link";
import { Grid } from "@mui/material";
import { Household, CheckinComplete, Services } from "@/components";
import { UserHelper } from "@churchapps/apphelper";

export function CheckinPage() {
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
    <>
      {UserHelper.user?.firstName
        ? (
          <Grid container spacing={3}>
            <Grid size={{ md: 8, xs: 12 }}>
              {content}
            </Grid>
          </Grid>
        )
        : (
          <h3 className="text-center w-100">
          Please <Link href="/login/?returnUrl=/my/checkin">Login</Link> to check in.
          </h3>
        )}
    </>
  );
}
