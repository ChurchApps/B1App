"use client";
import { ConfigHelper, EnvironmentHelper } from "@/helpers";

type Params = Promise<{ sdSlug: string; }>;

export default function PrintPage({ params }: { params: Params }) {
    // const { sdSlug } = await params

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
                        <h1>Donor Name</h1>
                        <p>Donor Address Line 1</p>
                        <p>Donor Address Line 2 optional</p>
                        <p>Donor Phone # optional</p>
                        <p>Donor Email Address optional</p>
                    </div>
                    {/* Church */}
                    <div style={{ width: "50%" }}>
                        <h1>Church Name</h1>
                        <p>Church Address</p>
                        <p>Church Address City/State/Zip</p>
                        <p>Church Phone #</p>
                        <p>Church Website</p>
                    </div>
                </div>
                <div style={{ margin: "0px", padding: "0px", borderTop: "2px solid #1976D2", width: "80%" }}></div>

                <div>
                    <h1>Statement Summary:</h1>
                    <div style={{ display: "flex" }}>
                        <div style={{ width: "50%" }}>
                            <h2>Total Contributions:</h2>
                            <div style={{ height: "80px", lineHeight: "80px", width: "80%", textAlign: "center", border: "4px solid #1976D2", fontSize: "40px" }}>$000.00</div>
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
                            <tr style={{ height: "28px" }}>
                                <td style={{ borderTop: "2px solid #1976D2", borderCollapse: "collapse", textAlign: "left", width: "15%", paddingLeft: "5px" }}></td>
                                <td style={{ borderTop: "2px solid #1976D2", borderCollapse: "collapse", textAlign: "left", width: "15%", paddingLeft: "5px" }}></td>
                                <td style={{ borderTop: "2px solid #1976D2", borderCollapse: "collapse", textAlign: "right", width: "50%", paddingRight: "5px", fontWeight: "bold" }}>Total Contributions:</td>
                                <td style={{ borderTop: "2px solid #1976D2", borderCollapse: "collapse", textAlign: "right", width: "20%", paddingRight: "5px", fontWeight: "bold" }}>$000.00</td>
                            </tr>
                        </tbody>
                    </table>
                    {/* Table End */}
                </div>

            </div>
        </>
    );
}
