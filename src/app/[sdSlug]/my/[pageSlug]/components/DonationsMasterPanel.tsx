"use client";

import React from "react";
import { CurrencyHelper, DateHelper, ExportLink } from "@churchapps/apphelper";
import type { DonationInterface } from "@churchapps/helpers";
import { Icon, Button, Menu, MenuItem } from "@mui/material";
import Link from "next/link";

interface Props {
  donations: DonationInterface[];
  isLoading: boolean;
}

export function DonationsMasterPanel({ donations, isLoading }: Props) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;
  const currentYearDonations = donations.filter((d) => new Date(d.donationDate).getFullYear() === currentYear);
  const lastYearDonations = donations.filter((d) => new Date(d.donationDate).getFullYear() === lastYear);
  const customHeaders = [
    { label: "amount", key: "amount" },
    { label: "donationDate", key: "donationDate" },
    { label: "fundName", key: "fund.name" },
    { label: "method", key: "method" },
    { label: "methodDetails", key: "methodDetails" }
  ];

  return (
    <>
      <div className="masterHeader">
        <h2>
          <Icon sx={{ color: "#1565C0" }}>volunteer_activism</Icon>
          Donations
          {donations.length > 0 && (
            <Button
              size="small"
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{ marginLeft: "auto", minWidth: "auto" }}
            >
              <Icon>download</Icon>
            </Button>
          )}
          <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
            <MenuItem onClick={() => setAnchorEl(null)} dense>
              <ExportLink data={currentYearDonations} filename="current_year_donations" customHeaders={customHeaders} text="Current Year (CSV)" icon="table_chart" />
            </MenuItem>
            <MenuItem onClick={() => setAnchorEl(null)} dense>
              <Link href="/my/donate/print"><Button><Icon>print</Icon>&nbsp;Current Year (Print)</Button></Link>
            </MenuItem>
            <MenuItem onClick={() => setAnchorEl(null)} dense>
              <ExportLink data={lastYearDonations} filename="last_year_donations" customHeaders={customHeaders} text="Last Year (CSV)" icon="table_chart" />
            </MenuItem>
            <MenuItem onClick={() => setAnchorEl(null)} dense>
              <Link href="/my/donate/print?prev=1"><Button><Icon>print</Icon>&nbsp;Last Year (Print)</Button></Link>
            </MenuItem>
          </Menu>
        </h2>
      </div>
      <div className="masterList">
        {isLoading && <div style={{ padding: 20, color: "#666" }}>Loading...</div>}
        {!isLoading && donations.length === 0 && (
          <div style={{ padding: 20, color: "#666" }}>Your donations will appear here.</div>
        )}
        {donations.map((d, i) => {
          const isPending = d.status === "pending";
          return (
            <div key={i} className="memberItem" style={{ cursor: "default", opacity: isPending ? 0.8 : 1 }}>
              <Icon sx={{ color: isPending ? "#ed6c02" : "#2e7d32", flexShrink: 0 }}>
                {isPending ? "schedule" : "check_circle"}
              </Icon>
              <div className="memberInfo">
                <div className="memberName">
                  {CurrencyHelper.formatCurrency(d.fund.amount)}
                  {isPending && <span style={{ fontSize: "0.75rem", color: "#ed6c02", marginLeft: 6 }}>(Pending)</span>}
                </div>
                <div className="memberSub">
                  {d.fund.name} &middot; {DateHelper.prettyDate(new Date(d.donationDate))}
                </div>
                <div className="memberSub">{d.method} - {d.methodDetails}</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
