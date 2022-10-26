import React from "react";
import { Stripe } from "@stripe/stripe-js";
import { InputBox, ErrorMessages } from "../../components";
import { FundDonations } from ".";
import { DonationPreviewModal } from "../modals/DonationPreviewModal";
import { ApiHelper, CurrencyHelper, DateHelper } from "../../helpers";
import { PersonInterface, StripePaymentMethod, StripeDonationInterface, FundDonationInterface, FundInterface } from "../../interfaces";
import { Grid, InputLabel, MenuItem, Select, TextField, FormControl, Button, SelectChangeEvent, FormControlLabel, Checkbox, FormGroup } from "@mui/material"

interface Props { person: PersonInterface, customerId: string, paymentMethods: StripePaymentMethod[], stripePromise: Promise<Stripe>, donationSuccess: (message: string) => void }

export const DonationForm: React.FC<Props> = (props) => {
  const [errorMessage, setErrorMessage] = React.useState<string>();
  const [fundDonations, setFundDonations] = React.useState<FundDonationInterface[]>();
  const [funds, setFunds] = React.useState<FundInterface[]>([]);
  const [fundsTotal, setFundsTotal] = React.useState<number>(0);
  const [transactionFee, setTransactionFee] = React.useState<number>(0);
  const [payFee, setPayFee] = React.useState<number>(0);
  const [total, setTotal] = React.useState<number>(0);
  const [paymentMethodName, setPaymentMethodName] = React.useState<string>(`${props?.paymentMethods[0]?.name} ****${props?.paymentMethods[0]?.last4}`);
  const [donationType, setDonationType] = React.useState<string>();
  const [showDonationPreviewModal, setShowDonationPreviewModal] = React.useState<boolean>(false);
  const [donation, setDonation] = React.useState<StripeDonationInterface>({
    id: props?.paymentMethods[0]?.id,
    type: props?.paymentMethods[0]?.type,
    customerId: props.customerId,
    person: {
      id: props.person?.id,
      email: props.person?.contactInfo.email,
      name: props.person?.name.display
    },
    amount: 0,
    billing_cycle_anchor: + new Date(),
    interval: {
      interval_count: 1,
      interval: "month"
    },
    funds: []
  });

  const loadData = () => {
    ApiHelper.get("/funds", "GivingApi").then(data => {
      setFunds(data);
      if (data.length) setFundDonations([{ fundId: data[0].id }]);
    });
  }

  const handleKeyDown = (e: React.KeyboardEvent<any>) => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } }

  const handleCheckChange = (e: React.SyntheticEvent<Element, Event>, checked: boolean) => {
    let d = { ...donation } as StripeDonationInterface;
    d.amount = checked ? fundsTotal + transactionFee : fundsTotal;
    let showFee = checked ? transactionFee : 0;
    setTotal(d.amount);
    setPayFee(showFee);
    setDonation(d);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    setErrorMessage(null);
    let d = { ...donation } as StripeDonationInterface;
    let value = e.target.value;
    switch (e.target.name) {
      case "method":
        d.id = value;
        let pm = props.paymentMethods.find(pm => pm.id === value);
        d.type = pm.type;
        setPaymentMethodName(`${pm.name} ****${pm.last4}`);
        break;
      case "type": setDonationType(value); break;
      case "date": d.billing_cycle_anchor = + new Date(value); break;
      case "interval-number": d.interval.interval_count = Number(value); break;
      case "interval-type": d.interval.interval = value; break;
      case "notes": d.notes = value; break;
      case "transaction-fee":
        const element = e.target as HTMLInputElement
        d.amount = element.checked ? fundsTotal + transactionFee : fundsTotal;
        let showFee = element.checked ? transactionFee : 0;
        setTotal(d.amount);
        setPayFee(showFee);
    }
    setDonation(d);
  }

  const handleCancel = () => { setDonationType(null); }
  const handleSave = () => {
    if (donation.amount < .5) setErrorMessage("Donation amount must be greater than $0.50");
    else setShowDonationPreviewModal(true);
  }
  const handleDonationSelect = (type: string) => {
    let dt = donationType === type ? null : type;
    setDonationType(dt);
  }

  const makeDonation = async (message: string) => {
    let results;
    if (donationType === "once") results = await ApiHelper.post("/donate/charge/", donation, "GivingApi");
    if (donationType === "recurring") results = await ApiHelper.post("/donate/subscribe/", donation, "GivingApi");

    if (results?.status === "succeeded" || results?.status === "pending" || results?.status === "active") {
      setShowDonationPreviewModal(false);
      setDonationType(null);
      props.donationSuccess(message);
    }
    if (results?.raw?.message) {
      setShowDonationPreviewModal(false);
      setErrorMessage("Error: " + results?.raw?.message);
    }
  }

  const handleFundDonationsChange = (fd: FundDonationInterface[]) => {
    setErrorMessage(null);
    setFundDonations(fd);
    let totalAmount = 0;
    let selectedFunds: any = [];
    for (const fundDonation of fd) {
      totalAmount += fundDonation.amount || 0;
      let fund = funds.find((fund: FundInterface) => fund.id === fundDonation.fundId);
      selectedFunds.push({ id: fundDonation.fundId, amount: fundDonation.amount || 0, name: fund.name });
    }
    let d = { ...donation };
    d.amount = totalAmount;
    d.funds = selectedFunds;
    setDonation(d);
    setFundsTotal(totalAmount);
    setTotal(totalAmount);
    setTransactionFee(getTransactionFee(totalAmount));
  }

  const getTransactionFee = (amount: number) => {
    const fixedFee = 0.30;
    const fixedPercent = 0.029;
    return Math.round(((amount + fixedFee) / (1 - fixedPercent) - amount) * 100) / 100;
  }

  React.useEffect(loadData, [props.person?.id]);

  if (!funds.length || !props?.paymentMethods[0]?.id) return null;
  else return (
    <>
      <DonationPreviewModal show={showDonationPreviewModal} onHide={() => setShowDonationPreviewModal(false)} handleDonate={makeDonation} donation={donation} donationType={donationType} payFee={payFee} paymentMethodName={paymentMethodName} funds={funds} />
      <InputBox id="donationBox" aria-label="donation-box" headerIcon="volunteer_activism" headerText="Donate" ariaLabelSave="save-button" cancelFunction={donationType ? handleCancel : undefined} saveFunction={donationType ? handleSave : undefined} saveText="Preview Donation">
        <Grid container spacing={3}>
          <Grid item md={6} xs={12}>
            <Button aria-label="single-donation" size="small" fullWidth style={{ minHeight: "50px" }} variant={donationType === "once" ? "contained" : "outlined"} onClick={() => handleDonationSelect("once")}>Make a Donation</Button>
          </Grid>
          <Grid item md={6} xs={12}>
            <Button aria-label="recurring-donation" size="small" fullWidth style={{ minHeight: "50px" }} variant={donationType === "recurring" ? "contained" : "outlined"} onClick={() => handleDonationSelect("recurring")}>Make a Recurring Donation</Button>
          </Grid>
        </Grid>
        {donationType
          && <div style={{ marginTop: "20px" }}>
            <Grid container spacing={3}>
              <Grid item md={6} xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Method</InputLabel>
                  <Select label="Method" name="method" aria-label="method" value={donation.id} className="capitalize" onChange={handleChange}>
                    {props.paymentMethods.map((paymentMethod: any, i: number) => <MenuItem key={i} value={paymentMethod.id}>{paymentMethod.name} ****{paymentMethod.last4}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item md={6} xs={12}>
                <TextField fullWidth name="date" type="date" aria-label="date" label={donationType === "once" ? "Donation Date" : "Recurring Donation Start Date"} value={DateHelper.formatHtml5Date(new Date(donation.billing_cycle_anchor))} onChange={handleChange} onKeyDown={handleKeyDown} />
              </Grid>
            </Grid>
            {donationType === "recurring"
              && <Grid container spacing={3}>
                <Grid item md={6} xs={12}>
                  <TextField fullWidth type="number" name="interval-number" label="Interval Number" value={donation.interval.interval_count} aria-label="interval-number" onChange={handleChange} />
                </Grid>
                <Grid item md={6} xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Interval Type</InputLabel>
                    <Select label="Interval Type" name="interval-type" aria-label="interval-type" value={donation.interval.interval} onChange={handleChange}>
                      <MenuItem value="day">Day(s)</MenuItem>
                      <MenuItem value="week">Week(s)</MenuItem>
                      <MenuItem value="month">Month(s)</MenuItem>
                      <MenuItem value="year">Year(s)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            }
            <div className="form-group">
              {funds && fundDonations
                && <>
                  <h4>Fund</h4>
                  <FundDonations fundDonations={fundDonations} funds={funds} updatedFunction={handleFundDonationsChange} />
                </>
              }
              {fundsTotal > 0
                && <>
                  <FormGroup>
                    <FormControlLabel control={<Checkbox />} name="transaction-fee" label={`I'll generously add ${CurrencyHelper.formatCurrency(transactionFee)} to cover the transaction fees so you can keep 100% of my donation.`} onChange={handleCheckChange} />
                  </FormGroup>
                  <p>Total Donation Amount: ${total}</p>
                </>
              }
              <TextField fullWidth label="Notes" multiline aria-label="note" name="notes" value={donation.notes || ""} onChange={handleChange} onKeyDown={handleKeyDown} />
            </div>
            {errorMessage && <ErrorMessages errors={[errorMessage]}></ErrorMessages>}
          </div>
        }
      </InputBox>
    </>
  );
}
