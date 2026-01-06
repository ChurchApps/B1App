"use client";

import { useEffect, useState } from "react";
import { Button } from "@mui/material";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Loading, UserHelper, ApiHelper } from "@churchapps/apphelper";
import { FormSubmissionEdit } from "@churchapps/apphelper-forms";
import type { ChurchInterface } from "@churchapps/helpers";
import { FormCardPayment } from "@/components/forms/FormCardPayment";

interface ElementInterface {
  id?: string;
  answers?: any;
}

interface Props {
  element: ElementInterface;
  church: ChurchInterface;
}

interface FormInterface {
  id?: string;
  name?: string;
  contentType?: string;
  restricted?: boolean;
  accessStartTime?: Date;
  accessEndTime?: Date;
  archived: boolean;
  action?: string;
  thankYouMessage?: string;
}

export const FormElement = (props: Props) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [addFormId, setAddFormId] = useState<string>("");
  const [isFormSubmitted, setIsFormSubmitted] = useState<boolean>(false);
  const [unRestrictedFormId, setUnRestrictedFormId] = useState<string>("");
  const formId = props.element.answers?.formId;
  const [form, setForm] = useState<FormInterface | undefined>(undefined);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe> | null>(null);

  useEffect(() => {
    if (formId && props.church) {
      loadData();
    }
  }, [formId, props.church]);

  const loadData = async () => {
    setIsLoading(true);
    type GatewayResponse = { gateways?: { provider?: string; publicKey?: string; enabled?: boolean }[] };

    try {
      const [gatewayResponse, formData] = await Promise.all([
        ApiHelper.get(`/donate/gateways/${props.church.id}`, "GivingApi").catch((): GatewayResponse => ({ gateways: [] })) as Promise<GatewayResponse>,
        ApiHelper.get("/forms/standalone/" + formId + "?churchId=" + props.church.id, "MembershipApi") as Promise<FormInterface>
      ]);

      // Process gateway response for Stripe
      const gateways = Array.isArray(gatewayResponse?.gateways) ? gatewayResponse.gateways : [];
      const enabledGateways = gateways.filter((g) => g && g.enabled !== false);
      const stripeGateway = enabledGateways.find((g) => g.provider?.toLowerCase() === "stripe");
      if (stripeGateway?.publicKey) {
        setStripePromise(loadStripe(stripeGateway.publicKey));
      }

      // Process form data
      if (formData.restricted) setAddFormId(formId);
      else setUnRestrictedFormId(formId);
      setForm(formData);
      setIsLoading(false);
    } catch (err) {
      console.error("FormElement loadData error", err);
      setIsLoading(false);
    }
  };

  const handleUpdate = () => setIsFormSubmitted(true);

  if (isLoading || !(props.church && formId)) {
    return <Loading />;
  }

  if (isFormSubmitted) {
    return (
      <p>
        {form?.thankYouMessage ? form.thankYouMessage : "Your form has been successfully submitted."}
        <Button
          variant="text"
          size="small"
          onClick={() => setIsFormSubmitted(false)}
          data-testid="form-fill-again-button"
        >
          Fill Again
        </Button>
      </p>
    );
  }

  return (
    <>
      <FormSubmissionEdit
        churchId={props.church.id}
        addFormId={addFormId}
        unRestrictedFormId={unRestrictedFormId}
        contentType="form"
        contentId={formId}
        formSubmissionId=""
        personId={UserHelper?.person?.id}
        updatedFunction={handleUpdate}
        showHeader={false}
        noBackground={true}
        stripePromise={stripePromise}
        FormCardPaymentComponent={FormCardPayment}
      />
    </>
  );
};
