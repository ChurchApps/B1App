"use client";
import UserContext from "@/context/UserContext";
import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { DonationInterface, FundDonationInterface, FundInterface } from "@churchapps/apphelper";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import { ArrayHelper, CurrencyHelper, UserHelper } from "@churchapps/helpers";
import { useContext, useEffect, useState } from "react";

type Params = Promise<{ sdSlug: string; }>;

export default function PrintPage({ params }: { params: Params }) {
    // const { sdSlug } = await params
    const context = useContext(UserContext);

    const [funds, setFunds] = useState<FundInterface[]>([]);
    const [fundDonations, setFundDonations] = useState<FundDonationInterface[]>([]);
    const [donations, setDonations] = useState<DonationInterface[]>([]);

    const loadData = () => {
        //const { isAuthenticated } = ApiHelper;
        //if (!isAuthenticated) return;
        ApiHelper.get("/funds", "GivingApi").then((f) => { setFunds(f) });
        ApiHelper.get("/fundDonations?personId=" + context.person.id, "GivingApi").then((fd) => { setFundDonations(fd) });
        ApiHelper.get("/donations?personId=" + context.person.id, "GivingApi").then((d) => { setDonations(d) });


        //window.print();
    };

    const getTotalContributions = () => {
        let result = 0;
        donations.forEach((d) => {
            result += d.amount;
        });
        return CurrencyHelper.formatCurrency(result);
    }

    const tableDonations = () => {
        const result: JSX.Element[] = [];
        fundDonations.forEach((fd) => {
            const donation = ArrayHelper.getOne(donations, "id", fd.donationId);
            const fund = ArrayHelper.getOne(funds, "id", fd.fundId);
            result.push(<tr style={{ height: "28px" }}>
                <td style={{ borderBottom: "2px solid #1976D2", borderRight: "2px solid #1976D2", borderCollapse: "collapse", textAlign: "left", width: "20%", paddingLeft: "5px" }}>{donation?.donationDate.toString()}</td>
                <td style={{ borderBottom: "2px solid #1976D2", borderRight: "2px solid #1976D2", borderCollapse: "collapse", textAlign: "left", width: "15%", paddingLeft: "5px" }}>{donation?.method}</td>
                <td style={{ borderBottom: "2px solid #1976D2", borderRight: "2px solid #1976D2", borderCollapse: "collapse", textAlign: "left", width: "45%", paddingLeft: "5px" }}>{fund?.name}</td>
                <td style={{ borderBottom: "2px solid #1976D2", borderLeft: "2px solid #1976D2", borderCollapse: "collapse", textAlign: "right", width: "20%", paddingRight: "5px" }}>{fd.amount}</td>
            </tr>);
        });
        return result;
    }

    useEffect(loadData, []);

    return (
        <>
            <div style={{ margin: "0px", padding: "0px", height: "100%", width: "100%", backgroundColor: "white", fontFamily: "Roboto, sans-serif" }}>
                <div style={{ margin: "0px", padding: "0px", borderTop: "24px solid #1976D2", width: "100%" }}></div>

                <div style={{ margin: "0px", padding: "0px", width: "100%" }}>
                    <h1>2024 Annual Giving Statement</h1>
                    <p>Period: Jan 1 - Jan 1, 2024</p>
                    <p>Issued: Jan 1, 2024 12:00PM</p>
                </div>
                <div style={{ margin: "0px", padding: "0px", borderTop: "2px solid #1976D2", width: "80%" }}></div>

                <div style={{ display: "flex" }}>
                    {/* Donor */}
                    <div style={{ width: "50%" }}>
                        <h1>{context.person?.name?.display}</h1>
                        <p>{context.person?.contactInfo?.address1}</p>
                        <p>{context.person?.contactInfo?.address2}</p>
                        <p>{context.person?.contactInfo?.mobilePhone}</p>
                        <p>{context.person?.contactInfo?.email}</p>
                    </div>
                    {/* Church */}
                    <div style={{ width: "50%" }}>
                        <h1>{context.userChurch?.church?.name}</h1>
                        <p>{context.userChurch?.church?.address1}</p>
                        <p>{context.userChurch?.church?.address2}</p>
                        <p>{context.userChurch?.church?.city}, {context.userChurch?.church?.country}, {context.userChurch?.church?.zip}</p>
                    </div>
                </div>
                <div style={{ margin: "0px", padding: "0px", borderTop: "2px solid #1976D2", width: "80%" }}></div>

                <div>
                    <h1>Statement Summary:</h1>
                    <div style={{ display: "flex" }}>
                        <div style={{ width: "50%" }}>
                            <h2>Total Contributions:</h2>
                            <div style={{ height: "80px", lineHeight: "80px", width: "80%", textAlign: "center", border: "4px solid #1976D2", fontSize: "40px" }}>{getTotalContributions()}</div>
                        </div>
                        <div style={{ width: "50%" }}>
                            <h2>Funds:</h2>
                            {/* Table Start */}
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead style={{ height: "24px" }}>
                                    <tr>
                                        <th style={{ borderBottom: "2px solid #1976D2", borderCollapse: "collapse", textAlign: "left", width: "70%", paddingLeft: "5px" }}>Fund</th>
                                        <th style={{ borderBottom: "2px solid #1976D2", borderCollapse: "collapse", textAlign: "right", width: "30%", paddingRight: "5px" }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ height: "24px" }}>
                                        <td style={{ borderBottom: "2px solid #1976D2", borderRight: "2px solid #1976D2", borderCollapse: "collapse", textAlign: "left", width: "70%", paddingLeft: "5px" }}>Fund Name</td>
                                        <td style={{ borderBottom: "2px solid #1976D2", borderLeft: "2px solid #1976D2", borderCollapse: "collapse", textAlign: "right", width: "30%", paddingRight: "5px" }}>$000.00</td>
                                    </tr>
                                </tbody>
                            </table>
                            {/* Table End */}
                        </div>
                    </div>
                </div>

                <div>
                    <h1>Contribution Details:</h1>
                    {/* Table Start */}
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead style={{ height: "28px" }}>
                            <tr>
                                <th style={{ borderBottom: "2px solid #1976D2", borderCollapse: "collapse", textAlign: "left", width: "15%", paddingLeft: "5px" }}>Date</th>
                                <th style={{ borderBottom: "2px solid #1976D2", borderCollapse: "collapse", textAlign: "left", width: "15%", paddingLeft: "5px" }}>Method</th>
                                <th style={{ borderBottom: "2px solid #1976D2", borderCollapse: "collapse", textAlign: "left", width: "50%", paddingLeft: "5px" }}>Fund</th>
                                <th style={{ borderBottom: "2px solid #1976D2", borderCollapse: "collapse", textAlign: "right", width: "20%", paddingRight: "5px" }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ height: "28px" }}>
                                <td style={{ borderBottom: "2px solid #1976D2", borderRight: "2px solid #1976D2", borderCollapse: "collapse", textAlign: "left", width: "20%", paddingLeft: "5px" }}>Jan 1, 2024</td>
                                <td style={{ borderBottom: "2px solid #1976D2", borderRight: "2px solid #1976D2", borderCollapse: "collapse", textAlign: "left", width: "15%", paddingLeft: "5px" }}>Cash</td>
                                <td style={{ borderBottom: "2px solid #1976D2", borderRight: "2px solid #1976D2", borderCollapse: "collapse", textAlign: "left", width: "45%", paddingLeft: "5px" }}>Fund Name</td>
                                <td style={{ borderBottom: "2px solid #1976D2", borderLeft: "2px solid #1976D2", borderCollapse: "collapse", textAlign: "right", width: "20%", paddingRight: "5px" }}>$000.00</td>
                            </tr>
                            {tableDonations()}
                            <tr style={{ height: "28px" }}>
                                <td style={{ borderTop: "2px solid #1976D2", borderCollapse: "collapse", textAlign: "left", width: "15%", paddingLeft: "5px" }}></td>
                                <td style={{ borderTop: "2px solid #1976D2", borderCollapse: "collapse", textAlign: "left", width: "15%", paddingLeft: "5px" }}></td>
                                <td style={{ borderTop: "2px solid #1976D2", borderCollapse: "collapse", textAlign: "right", width: "50%", paddingRight: "5px", fontWeight: "bold" }}>Total Contributions:</td>
                                <td style={{ borderTop: "2px solid #1976D2", borderCollapse: "collapse", textAlign: "right", width: "20%", paddingRight: "5px", fontWeight: "bold" }}>{getTotalContributions()}</td>
                            </tr>
                        </tbody>
                    </table>
                    {/* Table End */}
                </div>

            </div>
        </>
    );
}