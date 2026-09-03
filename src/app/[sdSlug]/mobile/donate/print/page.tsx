"use client";
import React, { useContext, useEffect, useState } from "react";
import UserContext from "@/context/UserContext";
import { AuthGuard } from "@/components/AuthGuard";
import type { DonationInterface, FundDonationInterface, FundInterface } from "@churchapps/helpers";
import { ApiHelper } from "@churchapps/apphelper";
import { ArrayHelper, CurrencyHelper, DateHelper } from "@churchapps/helpers";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { loadChurchAppearance } from "../../loadChurchAppearance";

type Params = Promise<{ sdSlug: string; }>;

const DEFAULT_ACCENT = "var(--print-accent)";

export default function PrintPage({ params }: { params: Params }) {
  const router = useRouter();
  const [sdSlug, setSdSlug] = useState<string>("");
  const [accentColor, setAccentColor] = useState<string>(DEFAULT_ACCENT);
  let currYear = new Date().getFullYear();
  const searchparams = useSearchParams();
  if (searchparams.get("prev") === "1") {
    currYear = currYear - 1;
  }
  const context = useContext(UserContext);

  useEffect(() => {
    params.then(({ sdSlug }) => setSdSlug(sdSlug));
  }, [params]);

  useEffect(() => {
    if (!sdSlug) return;
    loadChurchAppearance(sdSlug).then((app) => {
      if (app?.primaryColor) setAccentColor(app.primaryColor);
    });
  }, [sdSlug]);

  const [funds, setFunds] = useState<FundInterface[]>([]);
  const [fundDonations, setFundDonations] = useState<FundDonationInterface[]>([]);
  const [donations, setDonations] = useState<DonationInterface[]>([]);
  const [currency, setCurrency] = useState<string>("usd");
  const [churchSettings, setChurchSettings] = useState<Record<string, string>>({});


  const loadData = () => {
    ApiHelper.get("/funds", "GivingApi").then((f: FundInterface[]) => { setFunds(f); });
    ApiHelper.get("/fundDonations/my", "GivingApi").then((fd: FundDonationInterface[]) => { setFundDonations(fd); });
    ApiHelper.get("/gateways", "GivingApi").then((gws: { currency?: string }[]) => {
      if (Array.isArray(gws) && gws[0]?.currency) setCurrency(gws[0].currency);
    });
    ApiHelper.get("/donations/my", "GivingApi").then((d: DonationInterface[]) => {
      const result: DonationInterface[] = [];
      d.forEach((don: DonationInterface) => {
        const donDate = DateHelper.toDate(don.donationDate);
        if (donDate.getFullYear() === currYear) {
          result.push(don);
        }
      });
      setDonations(result);
    });


    setTimeout(() => {
      window.print();
      router.back();
    }, 1000);
  };

  const getDate = () => {
    const date = DateHelper.prettyDate(new Date());
    const time = DateHelper.prettyTime(new Date());
    const dateTime = `${date} ${time}`;
    return dateTime;
  };

  const getTotalContributions = () => {
    let result = 0;
    fundDonations.forEach((d) => {
      const donation = ArrayHelper.getOne(donations, "id", d.donationId);
      if (donation) {
        result += d.amount || 0;
      }
    });
    return CurrencyHelper.formatCurrencyWithLocale(result, currency);
  };

  const getFundArray = () => {
    const result: { fund: string; amount: number }[] = [];
    fundDonations.forEach((fd) => {
      const fund = ArrayHelper.getOne(funds, "id", fd.fundId);
      const donation = ArrayHelper.getOne(donations, "id", fd.donationId);
      if (donation) {

        result.push({ fund: fund?.name || "", amount: fd.amount || 0 });
      }
    });
    return result;
  };

  const tableDonations = () => {
    const result: React.ReactElement[] = [];
    fundDonations.forEach((fd) => {
      const donation = ArrayHelper.getOne(donations, "id", fd.donationId);
      const fund = ArrayHelper.getOne(funds, "id", fd.fundId);
      if (donation) {
        result.push(<tr style={{ height: "28px" }}>
          <td style={{ borderBottom: "2px solid var(--print-accent)", borderRight: "2px solid var(--print-accent)", borderCollapse: "collapse", textAlign: "left", width: "20%", paddingLeft: "5px" }}>{DateHelper.prettyDate(donation?.donationDate).toString()}</td>
          <td style={{ borderBottom: "2px solid var(--print-accent)", borderRight: "2px solid var(--print-accent)", borderCollapse: "collapse", textAlign: "left", width: "15%", paddingLeft: "5px" }}>{donation?.method}</td>
          <td style={{ borderBottom: "2px solid var(--print-accent)", borderRight: "2px solid var(--print-accent)", borderCollapse: "collapse", textAlign: "left", width: "45%", paddingLeft: "5px" }}>{fund?.name}</td>
          <td style={{ borderBottom: "2px solid var(--print-accent)", borderLeft: "2px solid var(--print-accent)", borderCollapse: "collapse", textAlign: "right", width: "20%", paddingRight: "5px" }}>{CurrencyHelper.formatCurrencyWithLocale(fd.amount || 0, donation?.currency || currency)}</td>
        </tr>);
      }
    });
    return result;
  };

  const tableFundTotal = () => {
    const fundArray = getFundArray();
    const result: { fund: string; total: number }[] = [];
    fundArray.forEach((fd) => {
      const existing = ArrayHelper.getOne(result, "fund", fd.fund);
      if (existing) {
        existing.total += fd.amount;
      } else {
        result.push({ fund: fd.fund, total: fd.amount });
      }
    });
    const tableValues: React.ReactElement[] = [];

    result.forEach((tv) => {
      tableValues.push(<tr style={{ height: "24px" }}>
        <td style={{ borderBottom: "2px solid var(--print-accent)", borderRight: "2px solid var(--print-accent)", borderCollapse: "collapse", textAlign: "left", width: "70%", paddingLeft: "5px" }}>{tv.fund}</td>
        <td style={{ borderBottom: "2px solid var(--print-accent)", borderLeft: "2px solid var(--print-accent)", borderCollapse: "collapse", textAlign: "right", width: "30%", paddingRight: "5px" }}>{CurrencyHelper.formatCurrencyWithLocale(tv.total, currency)}</td>
      </tr>);
    });
    return tableValues;
  };

  const churchId = context?.userChurch?.church?.id;
  useEffect(() => {
    if (!churchId) return;
    ApiHelper.get("/settings/public/" + churchId, "MembershipApi").then((s: Record<string, string>) => { setChurchSettings(s || {}); });
  }, [churchId]);

  // ponytail: duplicate of B1Admin's GivingStatementDocument legal block. Ceiling: the two
  // templates drift apart. Upgrade path: move the statement document into apphelper.
  const legalBlock = () => {
    const format = churchSettings.statementFormat;
    if (!format) return null;
    let eligible = 0;
    let nonEligible = 0;
    fundDonations.forEach((fd) => {
      if (!ArrayHelper.getOne(donations, "id", fd.donationId)) return;
      const fund: FundInterface = ArrayHelper.getOne(funds, "id", fd.fundId);
      if (fund?.taxDeductible === false) nonEligible += fd.amount || 0;
      else eligible += fd.amount || 0;
    });
    const church = context?.userChurch?.church;
    const orgAddress = churchSettings.statementOrgAddress || [church?.address1, church?.address2, church?.city, church?.country, church?.zip].filter(Boolean).join(", ");
    const contact = context?.person?.contactInfo;
    const donorAddress = [contact?.address1, contact?.address2, contact?.city, contact?.state, contact?.zip].filter(Boolean).join(", ");
    const title = format === "canada" ? "Official Receipt for Income Tax Purposes" : format === "australia" ? "Receipt for Donation" : "Donation Receipt";
    const numberLabel = format === "australia" ? "ABN" : "Charity registration number";
    return (
      <div data-testid="statement-legal-block" style={{ border: "2px solid var(--print-accent)", padding: "16px", margin: "16px 0" }}>
        <h2 style={{ marginTop: 0 }}>{title}</h2>
        <p>Receipt number: {currYear}-{context?.person?.id}</p>
        <p>{numberLabel}: {churchSettings.statementRegistrationNumber}</p>
        <p>Date issued: {DateHelper.prettyDate(new Date()).toString()}</p>
        {format === "canada" && <p>Place of issue: {churchSettings.statementCityOfIssue}</p>}
        <p>{church?.name}{orgAddress ? ", " + orgAddress : ""}</p>
        <p>{context?.person?.name?.display}{donorAddress ? ", " + donorAddress : ""}</p>
        {format === "australia" && <p>{church?.name} is endorsed as a Deductible Gift Recipient. Donations of $2 or more are tax deductible.</p>}
        {format === "newZealand" && <p>Donation</p>}
        <p style={{ fontWeight: "bold" }}>Eligible amount of gift for income tax purposes: {CurrencyHelper.formatCurrencyWithLocale(eligible, currency)}</p>
        {nonEligible > 0 && <p>Gifts not eligible for a tax receipt: {CurrencyHelper.formatCurrencyWithLocale(nonEligible, currency)}</p>}
        {format !== "australia" && <p style={{ borderTop: "1px solid #333", width: "260px", paddingTop: "4px" }}>{churchSettings.statementSignatory} — Authorized signature</p>}
        {format === "canada" && <p>Canada Revenue Agency: canada.ca/charities-giving</p>}
      </div>
    );
  };

  useEffect(loadData, []);

  return (
    <AuthGuard sdSlug={sdSlug}>
      <div style={{ margin: "0px", padding: "0px", height: "100%", width: "100%", backgroundColor: "white", fontFamily: "Roboto, sans-serif", ["--print-accent" as any]: accentColor }}>
        <div style={{ margin: "0px", padding: "0px", borderTop: "24px solid var(--print-accent)", width: "100%" }}></div>

        <div style={{ margin: "0px", padding: "0px", width: "100%" }}>
          <h1>{currYear} Annual Giving Statement</h1>
          <p>Period: Jan 1 - Dec 31, {currYear}</p>
          <p>Issued: {getDate()}</p>
        </div>
        <div style={{ margin: "0px", padding: "0px", borderTop: "2px solid var(--print-accent)", width: "80%" }}></div>

        <div style={{ display: "flex" }}>
          <div style={{ width: "50%" }}>
            <h1>{context?.person?.name?.display}</h1>
            <p>{context?.person?.contactInfo?.address1}</p>
            <p>{context?.person?.contactInfo?.address2}</p>
            <p>{context?.person?.contactInfo?.mobilePhone}</p>
            <p>{context?.person?.contactInfo?.email}</p>
          </div>
          <div style={{ width: "50%" }}>
            <h1>{context?.userChurch?.church?.name}</h1>
            <p>{context?.userChurch?.church?.address1}</p>
            <p>{context?.userChurch?.church?.address2}</p>
            <p>{context?.userChurch?.church?.city}, {context?.userChurch?.church?.country}, {context?.userChurch?.church?.zip}</p>
          </div>
        </div>
        <div style={{ margin: "0px", padding: "0px", borderTop: "2px solid var(--print-accent)", width: "80%" }}></div>

        {legalBlock()}

        <div>
          <h1>Statement Summary:</h1>
          <div style={{ display: "flex" }}>
            <div style={{ width: "50%" }}>
              <h2>Total Contributions:</h2>
              <div style={{ height: "80px", lineHeight: "80px", width: "80%", textAlign: "center", border: "4px solid var(--print-accent)", fontSize: "40px" }}>{getTotalContributions()}</div>
            </div>
            <div style={{ width: "50%" }}>
              <h2>Funds:</h2>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ height: "24px" }}>
                  <tr>
                    <th style={{ borderBottom: "2px solid var(--print-accent)", borderCollapse: "collapse", textAlign: "left", width: "70%", paddingLeft: "5px" }}>Fund</th>
                    <th style={{ borderBottom: "2px solid var(--print-accent)", borderCollapse: "collapse", textAlign: "right", width: "30%", paddingRight: "5px" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {tableFundTotal()}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <h1>Contribution Details:</h1>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ height: "28px" }}>
              <tr>
                <th style={{ borderBottom: "2px solid var(--print-accent)", borderCollapse: "collapse", textAlign: "left", width: "15%", paddingLeft: "5px" }}>Date</th>
                <th style={{ borderBottom: "2px solid var(--print-accent)", borderCollapse: "collapse", textAlign: "left", width: "15%", paddingLeft: "5px" }}>Method</th>
                <th style={{ borderBottom: "2px solid var(--print-accent)", borderCollapse: "collapse", textAlign: "left", width: "50%", paddingLeft: "5px" }}>Fund</th>
                <th style={{ borderBottom: "2px solid var(--print-accent)", borderCollapse: "collapse", textAlign: "right", width: "20%", paddingRight: "5px" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {tableDonations()}
              <tr style={{ height: "28px" }}>
                <td style={{ borderTop: "2px solid var(--print-accent)", borderCollapse: "collapse", textAlign: "left", width: "15%", paddingLeft: "5px" }}></td>
                <td style={{ borderTop: "2px solid var(--print-accent)", borderCollapse: "collapse", textAlign: "left", width: "15%", paddingLeft: "5px" }}></td>
                <td style={{ borderTop: "2px solid var(--print-accent)", borderCollapse: "collapse", textAlign: "right", width: "50%", paddingRight: "5px", fontWeight: "bold" }}>Total Contributions:</td>
                <td style={{ borderTop: "2px solid var(--print-accent)", borderCollapse: "collapse", textAlign: "right", width: "20%", paddingRight: "5px", fontWeight: "bold" }}>{getTotalContributions()}</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </AuthGuard>
  );
}
