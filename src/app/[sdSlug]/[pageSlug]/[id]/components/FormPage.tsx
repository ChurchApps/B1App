"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { PersonHelper, WrapperPageProps } from "@/helpers";
import { Loading } from "@churchapps/apphelper";
import { FormSubmissionEdit } from "@churchapps/apphelper-forms";
import { DateHelper } from "@churchapps/apphelper";
import { ApiHelper } from "@churchapps/apphelper";
import type { FormInterface } from "@churchapps/helpers";
import { Container } from "@mui/material";
import { FormCardPayment } from "@/components/forms/FormCardPayment";

interface Props extends WrapperPageProps {
  formId: string;
}

export function FormPage(props: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFormSubmitted, setIsFormSubmitted] = useState<boolean>(false);
  const [restrictedForm, setRestrictedForm] = useState<boolean>(true);
  const [early, setEarly] = useState<Date>(null);
  const [late, setLate] = useState<Date>(null);
  const [addFormId, setAddFormId] = useState<string>("");
  const [unRestrictedFormId, setUnRestrictedFormId] = useState<string>("");
  const [form, setForm] = useState<FormInterface>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe> | null>(null);

  const loadData = async () => {
    setIsLoading(true);

    // Load both APIs in parallel
    type GatewayResponse = { gateways?: { provider?: string; publicKey?: string; enabled?: boolean }[] };
    const [gatewayResponse, formData] = await Promise.all([
      ApiHelper.get(`/donate/gateways/${props.config.church.id}`, "GivingApi").catch((): GatewayResponse => ({ gateways: [] })) as Promise<GatewayResponse>,
      ApiHelper.get("/forms/standalone/" + props.formId + "?churchId=" + props.config.church.id, "MembershipApi") as Promise<FormInterface>
    ]);

    // Process gateway response
    const gateways = Array.isArray(gatewayResponse?.gateways) ? gatewayResponse.gateways : [];
    const enabledGateways = gateways.filter((g) => g && g.enabled !== false);
    const stripeGateway = enabledGateways.find((g) => g.provider?.toLowerCase() === "stripe");
    if (stripeGateway?.publicKey) {
      setStripePromise(loadStripe(stripeGateway.publicKey));
    }

    // Process form data
    const data = formData;
    const now = new Date().setHours(0, 0, 0, 0);
    const start = data.accessStartTime ? new Date(data.accessStartTime) : null;
    const end = data.accessEndTime ? new Date(data.accessEndTime) : null;

    if (start && start.setHours(0, 0, 0, 0) > now) setEarly(start);
    if (end && end.setHours(0, 0, 0, 0) < now) setLate(end);
    setRestrictedForm(data.restricted);
    if (data.restricted) setAddFormId(props.formId);
    else setUnRestrictedFormId(props.formId);
    setIsLoading(false);
    setForm(data);
  };

  const handleUpdate = () => setIsFormSubmitted(true);

  const showForm = () => (
    <FormSubmissionEdit
      churchId={props.config.church.id}
      addFormId={addFormId}
      unRestrictedFormId={unRestrictedFormId}
      contentType="form"
      contentId={props.formId}
      formSubmissionId=""
      personId={PersonHelper?.person?.id}
      updatedFunction={handleUpdate}
      cancelFunction={() => redirect("/")}
      stripePromise={stripePromise}
      FormCardPaymentComponent={FormCardPayment}
    />
  );

  const getForm = () => {
    if (isLoading) return <Loading />;
    if (early)
      return <h3 className="text-center">This form isn't available until {DateHelper.prettyDateTime(early)}</h3>;
    if (late) return <h3 className="text-center">This form closed on {DateHelper.prettyDateTime(late)}</h3>;
    if (!restrictedForm || PersonHelper?.person?.id) return showForm();
    if (!PersonHelper?.person?.id)
      return (
        <h3 className="text-center">
          <Link href={"/login?returnUrl=/forms/" + props.formId}>Login</Link> to view this form.
        </h3>
      );
    return <></>;
  };

  useEffect(() => {
    loadData();
  }, [props.formId]);

  return (
    <>
      <Container>
        <h1>{form?.name}</h1>
        {isFormSubmitted
          ? (
            <h3 className="text-center">Your form has been successfully submitted.</h3>
          )
          : (
            getForm()
          )}
      </Container>
    </>
  );
}
