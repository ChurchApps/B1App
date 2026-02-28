"use client";

import React, { useState, useEffect } from "react";
import { ApiHelper } from "@churchapps/apphelper";
import { VolunteerBrowse } from "@/components/serving/VolunteerBrowse";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";

interface Props {
  config: ConfigurationInterface;
}

export function VolunteerPage({ config }: Props) {
  const [signupPlans, setSignupPlans] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (config?.church?.id) {
      ApiHelper.getAnonymous("/plans/public/signup/" + config.church.id, "DoingApi").then((data: any[]) => {
        setSignupPlans(data || []);
        setLoaded(true);
      });
    }
  }, [config?.church?.id]);

  if (!loaded) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: "24px 32px" }}>
      <VolunteerBrowse signupPlans={signupPlans} />
    </div>
  );
}
