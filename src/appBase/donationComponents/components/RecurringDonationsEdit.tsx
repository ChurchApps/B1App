import React from "react";
import { ApiHelper } from "../../helpers";
import { InputBox } from "../../components";
import { StripePaymentMethod, SubscriptionInterface } from "../../interfaces";
import { FormControl, Grid, InputLabel, MenuItem, Select, SelectChangeEvent, TextField } from "@mui/material"

interface Props { subscriptionUpdated: (message?: string) => void, customerId: string, paymentMethods: StripePaymentMethod[], editSubscription: SubscriptionInterface };

export const RecurringDonationsEdit: React.FC<Props> = (props) => {
  const [editSubscription, setEditSubscription] = React.useState<SubscriptionInterface>(props.editSubscription);

  const handleCancel = () => { props.subscriptionUpdated(); }
  const handleSave = () => {
    let sub = { ...editSubscription } as SubscriptionInterface;
    const pmFound = props.paymentMethods.find((pm: StripePaymentMethod) => pm.id === sub.id);
    if (!pmFound) {
      let pm = props.paymentMethods[0];
      sub.default_payment_method = pm.type === "card" ? pm.id : null;
      sub.default_source = pm.type === "bank" ? pm.id : null;
    }
    ApiHelper.post("/subscriptions", [sub], "GivingApi").then(() => props.subscriptionUpdated("Recurring donation updated."))
  }

  const handleDelete = () => {
    const conf = window.confirm("Are you sure you want to delete this recurring donation?");
    if (!conf) return;
    let promises = [];
    promises.push(ApiHelper.delete("/subscriptions/" + props.editSubscription.id, "GivingApi"));
    promises.push(ApiHelper.delete("/subscriptionfunds/subscription/" + props.editSubscription.id, "GivingApi"));
    Promise.all(promises).then(() => props.subscriptionUpdated("Recurring donation canceled."));
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    let sub = { ...editSubscription } as SubscriptionInterface;
    let value = e.target.value;
    switch (e.target.name) {
      case "method":
        let pm = props.paymentMethods.find((pm: StripePaymentMethod) => pm.id === value);
        sub.default_payment_method = pm.type === "card" ? value : null;
        sub.default_source = pm.type === "bank" ? value : null;
        break;
      case "interval-number": sub.plan.interval_count = Number(value); break;
      case "interval-type": sub.plan.interval = value; break;
    }
    setEditSubscription(sub);
  }

  const getFields = () => (
    <>
      <Grid container spacing={3}>
        <Grid item md={6} xs={12}>
          <FormControl fullWidth>
            <InputLabel>Method</InputLabel>
            <Select label="Method" name="method" aria-label="method" value={editSubscription.default_payment_method || editSubscription.default_source} className="capitalize" onChange={handleChange}>
              {props.paymentMethods.map((paymentMethod: any, i: number) => <MenuItem key={i} value={paymentMethod.id}>{paymentMethod.name} ****{paymentMethod.last4}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid item md={6} xs={12}>
          <TextField fullWidth label="Interval Number" name="interval-number" aria-label="interval-number" type="number" value={editSubscription.plan.interval_count} InputProps={{ inputProps: { min: 0, max: 10 } }} onChange={handleChange} />
        </Grid>
        <Grid item md={6} xs={12}>
          <FormControl fullWidth>
            <InputLabel>Interval Type</InputLabel>
            <Select label="Interval Type" name="interval-type" aria-label="interval-type" value={editSubscription.plan.interval} onChange={handleChange}>
              <MenuItem value="day">Day(s)</MenuItem>
              <MenuItem value="week">Week(s)</MenuItem>
              <MenuItem value="month">Month(s)</MenuItem>
              <MenuItem value="year">Year(s)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </>
  )

  return (
    <InputBox aria-label="person-details-box" headerIcon="person" headerText="Edit Recurring Donation" ariaLabelSave="save-button" ariaLabelDelete="delete-button" cancelFunction={handleCancel} deleteFunction={handleDelete} saveFunction={handleSave}>
      {getFields()}
    </InputBox>
  );
}
