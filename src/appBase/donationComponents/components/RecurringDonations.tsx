import React from "react";
import { DisplayBox } from "../../components";
import { ApiHelper, UserHelper, CurrencyHelper, DateHelper } from "../../helpers";
import { Permissions, SubscriptionInterface } from "../../interfaces";
import { RecurringDonationsEdit } from ".";
import { Icon, Table, TableBody, TableCell, TableRow, TableHead } from "@mui/material";

interface Props { customerId: string, paymentMethods: any[], appName: string, dataUpdate: (message?: string) => void, };

export const RecurringDonations: React.FC<Props> = (props) => {
  const [subscriptions, setSubscriptions] = React.useState<SubscriptionInterface[]>([]);
  const [mode, setMode] = React.useState("display");
  const [editSubscription, setEditSubscription] = React.useState<SubscriptionInterface>();

  const loadData = () => {
    if (props.customerId) {
      ApiHelper.get("/customers/" + props.customerId + "/subscriptions", "GivingApi").then(subResult => {
        const subs: SubscriptionInterface[] = [];
        const requests = subResult.data?.map((s: any) => ApiHelper.get("/subscriptionfunds?subscriptionId=" + s.id, "GivingApi").then(subFunds => {
          s.funds = subFunds;
          subs.push(s);
        }));
        return requests && Promise.all(requests).then(() => {
          setSubscriptions(subs);
        });
      });
    }
  }

  const handleUpdate = (message: string) => {
    loadData();
    setMode("display");
    if (message) props.dataUpdate(message);
  }

  const handleEdit = (sub: SubscriptionInterface) => (e: React.MouseEvent) => {
    e.preventDefault();
    setEditSubscription(sub);
    setMode("edit");
  }

  const getPaymentMethod = (sub: SubscriptionInterface) => {
    const pm = props.paymentMethods.find((pm: any) => pm.id === (sub.default_payment_method || sub.default_source));
    if (!pm) return <span style={{ color: "red" }}>Payment method not found.</span>;
    return `${pm.name} ****${pm.last4}`;
  }

  const getInterval = (subscription: SubscriptionInterface) => {
    let interval = subscription.plan.interval_count + " " + subscription.plan.interval;
    return subscription.plan.interval_count > 1 ? interval + "s" : interval;
  }

  const getFunds = (subscription: SubscriptionInterface) => {
    let result: JSX.Element[] = [];
    subscription.funds.forEach((fund: any) => {
      result.push(
        <div key={subscription.id + fund.id}>
          {fund.name} <span style={{ float: "right" }}>{CurrencyHelper.formatCurrency(fund.amount)}</span>
        </div>
      );
    });
    const total = (subscription.plan.amount / 100);
    result.push(
      <div key={subscription.id + "-total"} style={{ borderTop: "solid #dee2e6 1px" }}>
        Total <span style={{ float: "right" }}>{CurrencyHelper.formatCurrency(total)}</span>
      </div>
    );
    return result;
  }

  const getEditOptions = (sub: SubscriptionInterface) => {
    if ((!UserHelper.checkAccess(Permissions.givingApi.settings.edit) && props.appName !== "B1App") || props?.paymentMethods?.length === 0) return null;
    return <a aria-label="edit-button" onClick={handleEdit(sub)} href="about:blank"><Icon>edit</Icon></a>;
  }

  const getTableHeader = () => {
    let result: JSX.Element[] = [];
    result.push(<TableRow key="header"><th>Start Date</th><th>Amount</th><th>Interval</th><th>Payment Method</th>{props?.paymentMethods?.length > 0 && <th>Edit</th>}</TableRow>);
    return result;
  }

  const getTableRows = () => {
    let rows: JSX.Element[] = [];

    subscriptions.forEach((sub: any) => {
      rows.push(
        <TableRow key={sub.id}>
          <TableCell>{DateHelper.prettyDate(new Date(sub.billing_cycle_anchor * 1000))}</TableCell>
          <TableCell>{getFunds(sub)}</TableCell>
          <TableCell>Every {getInterval(sub)}</TableCell>
          <TableCell className="capitalize">{getPaymentMethod(sub)}</TableCell>
          <TableCell align="right">{getEditOptions(sub)}</TableCell>
        </TableRow>
      );
    });
    return rows;
  }

  const getSubscriptionsTable = () => (
    <Table>
      <TableHead>{getTableHeader()}</TableHead>
      <TableBody>{getTableRows()}</TableBody>
    </Table>
  )

  React.useEffect(loadData, []); //eslint-disable-line

  if (!subscriptions.length) return null;
  if (mode === "display") {
    return (
      <DisplayBox data-cy="recurring-donations" headerIcon="restart_alt" headerText="Recurring Donations">
        {getSubscriptionsTable()}
      </DisplayBox>
    );
  }
  if (mode === "edit" && editSubscription) {
    return (
      <RecurringDonationsEdit customerId={props.customerId} paymentMethods={props.paymentMethods} editSubscription={editSubscription} subscriptionUpdated={handleUpdate} />
    );
  }
}
