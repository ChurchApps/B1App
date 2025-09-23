"use client";

import React from "react";
import type { Stripe } from "@stripe/stripe-js";
import { DonationForm } from "@churchapps/apphelper-donations";
import { PersonInterface, ChurchInterface } from "@churchapps/helpers";
import { StripePaymentMethod } from "@churchapps/helpers";

interface Props {
  person: PersonInterface | null;
  customerId: string | null;
  paymentMethods: StripePaymentMethod[] | null;
  stripePromise: Promise<Stripe> | null;
  donationSuccess: (message: string) => void;
  church?: ChurchInterface;
  churchLogo?: string;
}

// Memoized component to prevent unnecessary re-renders
const MemoizedDonationForm = React.memo(DonationForm);

const StableDonationFormComponent: React.FC<Props> = (props) => {
  // Memoize the donationSuccess callback to prevent re-renders
  const stableDonationSuccess = React.useCallback((message: string) => {
    props.donationSuccess(message);
  }, [props.donationSuccess]);

  // Only render when all required props are available
  if (!props.person
      || !props.customerId
      || !props.paymentMethods
      || props.paymentMethods.length === 0
      || !props.stripePromise) {
    return <div>Loading payment options...</div>;
  }

  return (
    <MemoizedDonationForm
      person={props.person}
      customerId={props.customerId}
      paymentMethods={props.paymentMethods}
      stripePromise={props.stripePromise}
      donationSuccess={stableDonationSuccess}
      church={props.church}
      churchLogo={props.churchLogo}
      data-testid="donation-form"
    />
  );
};

StableDonationFormComponent.displayName = "StableDonationForm";

export const StableDonationForm = React.memo(StableDonationFormComponent);
