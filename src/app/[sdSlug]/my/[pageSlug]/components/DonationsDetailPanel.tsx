"use client";

import React from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { StableDonationForm } from "@/components/donate/StableDonationForm";
import { RecurringDonations, StripePaymentMethod as AppHelperStripePaymentMethod } from "@churchapps/apphelper-donations";
import { PaymentMethods } from "@churchapps/apphelper-donations";
import { ApiHelper, Loading, UniqueIdHelper, useMountedState } from "@churchapps/apphelper";
import { DonationInterface, PersonInterface, StripePaymentMethod, ChurchInterface } from "@churchapps/helpers";
import { Alert } from "@mui/material";

interface Props {
  personId: string;
  church?: ChurchInterface;
  churchLogo?: string;
  onDataUpdate: () => void;
}

/**
 * Converts an AppHelper StripePaymentMethod to a Helpers StripePaymentMethod.
 */
const convertToHelpersPaymentMethod = (appHelperPM: AppHelperStripePaymentMethod): StripePaymentMethod => new StripePaymentMethod({
  id: appHelperPM.id,
  type: appHelperPM.type,
  card: appHelperPM.name && appHelperPM.type === "card"
    ? { brand: appHelperPM.name, last4: appHelperPM.last4, exp_month: appHelperPM.exp_month, exp_year: appHelperPM.exp_year }
    : undefined,
  bank_name: appHelperPM.type === "bank" ? appHelperPM.name : undefined,
  last4: appHelperPM.last4,
  exp_month: appHelperPM.exp_month,
  exp_year: appHelperPM.exp_year,
  status: appHelperPM.status,
  account_holder_name: appHelperPM.account_holder_name,
  account_holder_type: appHelperPM.account_holder_type
});

export function DonationsDetailPanel({ personId, church, churchLogo, onDataUpdate }: Props) {
  const [stripePromise, setStripe] = React.useState<Promise<Stripe>>(null);
  const [paymentMethods, setPaymentMethods] = React.useState<StripePaymentMethod[]>(null);
  const [appHelperPaymentMethods, setAppHelperPaymentMethods] = React.useState<AppHelperStripePaymentMethod[]>(null);
  const [customerId, setCustomerId] = React.useState(null);
  const [person, setPerson] = React.useState<PersonInterface>(null);
  const [message, setMessage] = React.useState<string>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const isMounted = useMountedState();

  const loadData = () => {
    if (!UniqueIdHelper.isMissing(personId)) {
      setIsLoading(true);
      ApiHelper.get("/gateways", "GivingApi").then((data: { publicKey?: string }[]) => {
        if (data.length && data[0]?.publicKey) {
          if (isMounted()) setStripe(loadStripe(data[0].publicKey));
          ApiHelper.get("/paymentmethods/personid/" + personId, "GivingApi").then((results: { provider?: string; customerId?: string }[]) => {
            if (!isMounted()) return;
            if (!Array.isArray(results) || results.length === 0) {
              setPaymentMethods([]);
              setAppHelperPaymentMethods([]);
            } else {
              const methods: StripePaymentMethod[] = [];
              const appHelperMethods: AppHelperStripePaymentMethod[] = [];
              for (const pm of results) {
                if (pm.provider === "stripe") {
                  const appHelperPM = new AppHelperStripePaymentMethod(pm);
                  appHelperMethods.push(appHelperPM);
                  methods.push(convertToHelpersPaymentMethod(appHelperPM));
                }
                if (pm.customerId && !customerId) setCustomerId(pm.customerId);
              }
              setPaymentMethods(methods);
              setAppHelperPaymentMethods(appHelperMethods);
            }
            setIsLoading(false);
          });
          ApiHelper.get("/people/" + personId, "MembershipApi").then((data: PersonInterface) => {
            if (isMounted()) setPerson(data);
          });
        } else {
          setPaymentMethods([]);
          setAppHelperPaymentMethods([]);
          setIsLoading(false);
        }
      });
    } else {
      setPaymentMethods([]);
      setAppHelperPaymentMethods([]);
      setIsLoading(false);
    }
  };

  const handleDataUpdate = (msg?: string) => {
    setMessage(msg);
    setTimeout(() => { loadData(); onDataUpdate(); }, 2000);
  };

  React.useEffect(loadData, [personId]);

  if (isLoading) {
    return (
      <>
        {message && <Alert severity="success">{message}</Alert>}
        <Loading />
      </>
    );
  }

  return (
    <>
      {message && <Alert severity="success">{message}</Alert>}
      <StableDonationForm
        person={person}
        customerId={customerId}
        paymentMethods={appHelperPaymentMethods}
        stripePromise={stripePromise}
        donationSuccess={handleDataUpdate}
        church={church}
        churchLogo={churchLogo}
      />
      <RecurringDonations customerId={customerId} paymentMethods={appHelperPaymentMethods || []} appName="B1App" dataUpdate={handleDataUpdate} />
      <PaymentMethods person={person} customerId={customerId} paymentMethods={appHelperPaymentMethods || []} appName="B1App" stripePromise={stripePromise} dataUpdate={handleDataUpdate} />
    </>
  );
}
