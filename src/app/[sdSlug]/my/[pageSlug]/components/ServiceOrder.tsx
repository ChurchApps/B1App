import React from "react";
import { Stack } from "@mui/material";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import { DisplayBox } from "@churchapps/apphelper/dist/components/DisplayBox";
import { SmallButton } from "@churchapps/apphelper/dist/components/SmallButton";
import type { PlanInterface } from "@churchapps/helpers";
import { PlanItem } from "./PlanItem";
import { PlanItemInterface } from "@/helpers";

interface Props {
  plan: PlanInterface
}

export const ServiceOrder = (props: Props) => {
  const [planItems, setPlanItems] = React.useState<PlanItemInterface[]>([]);


  const loadData = async () => {
    if (props.plan?.id) {
      ApiHelper.get("/planItems/plan/" + props.plan.id.toString(), "DoingApi").then(d => { setPlanItems(d); });
    }
  }

  const getEditContent = () => (
    <Stack direction="row">
      <SmallButton href={"/plans/print/" + props.plan?.id} icon="print" data-testid="print-service-order-button" />
    </Stack>
  )

  React.useEffect(() => { loadData(); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return (<DisplayBox headerText="Order of Service" headerIcon="album" editContent={getEditContent()}>
    {planItems.map((pi, i) => <PlanItem planItem={pi} />)}
  </DisplayBox>)
};

