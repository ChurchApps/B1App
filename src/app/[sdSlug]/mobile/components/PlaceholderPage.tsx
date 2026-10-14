"use client";

import React from "react";
import { Box } from "@mui/material";
import { PageHead, Plate, PlateSection, QuietEmpty, TextLink } from "./kit";

interface Props {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}

export const PlaceholderPage = ({ title, description, actionLabel, actionHref }: Props) => (
  <>
    <PageHead title={title} />
    <Plate>
      <PlateSection>
        {description && <QuietEmpty>{description}</QuietEmpty>}
        {actionLabel && actionHref && <Box sx={{ mt: "8px" }}><TextLink href={actionHref}>{actionLabel}</TextLink></Box>}
      </PlateSection>
    </Plate>
  </>
);
