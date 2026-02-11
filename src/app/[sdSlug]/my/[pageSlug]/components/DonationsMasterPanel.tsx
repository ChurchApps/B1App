"use client";

import React from "react";
import { Icon } from "@mui/material";

export type DonationSection = "give" | "history" | "recurring";

interface Props {
  activeSection: DonationSection;
  onSectionChange: (section: DonationSection) => void;
}

const sections: { id: DonationSection; label: string; icon: string; description: string }[] = [
  { id: "give", label: "Give Now", icon: "volunteer_activism", description: "Make a one-time or recurring donation" },
  { id: "history", label: "History", icon: "receipt_long", description: "View past donations and export records" },
  { id: "recurring", label: "Recurring Donations", icon: "autorenew", description: "Manage scheduled giving and payment methods" },
];

export function DonationsMasterPanel({ activeSection, onSectionChange }: Props) {
  return (
    <>
      <div className="masterHeader">
        <h2>
          <Icon sx={{ color: "#1565C0" }}>payments</Icon>
          My Donations
        </h2>
      </div>
      <div className="masterList">
        {sections.map((s) => (
          <div
            key={s.id}
            className={"memberItem" + (activeSection === s.id ? " selected" : "")}
            onClick={() => onSectionChange(s.id)}
          >
            <Icon sx={{ color: "#1565C0", flexShrink: 0 }}>{s.icon}</Icon>
            <div className="memberInfo">
              <div className="memberName">{s.label}</div>
              <div className="memberSub">{s.description}</div>
            </div>
            <Icon className="memberChevron">chevron_right</Icon>
          </div>
        ))}
      </div>
    </>
  );
}
