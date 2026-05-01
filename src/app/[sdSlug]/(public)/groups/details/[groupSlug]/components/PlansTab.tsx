"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableRow, TableHead } from "@mui/material";
import { ApiHelper, DisplayBox, Loading, Locale, DateHelper } from "@churchapps/apphelper";
import type { PlanInterface } from "@churchapps/helpers";

interface Props {
  groupId: string;
  sdSlug: string;
}

export function PlansTab(props: Props) {
  const [plans, setPlans] = useState<PlanInterface[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!props.groupId) return;
    setIsLoading(true);
    ApiHelper.get(`/groups/${props.groupId}/plans`, "MembershipApi")
      .then((data: PlanInterface[]) => setPlans(Array.isArray(data) ? data : []))
      .finally(() => setIsLoading(false));
  }, [props.groupId]);

  if (isLoading) return <Loading />;

  return (
    <>
      <h2>{Locale.label("groupsPage.plans")}</h2>
      <DisplayBox headerText={Locale.label("groupsPage.plans")}>
        {plans.length === 0 ? (
          <p>{Locale.label("groupsPage.noPlans")}</p>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{Locale.label("groupsPage.planName")}</TableCell>
                <TableCell>{Locale.label("groupsPage.serviceDate")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {plans.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/${props.sdSlug}/mobile/plans/${p.id}`}>{p.name}</Link>
                  </TableCell>
                  <TableCell>{p.serviceDate ? DateHelper.formatHtml5Date(new Date(p.serviceDate as any)) : ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DisplayBox>
    </>
  );
}
