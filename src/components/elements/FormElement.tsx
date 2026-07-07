"use client";

import { useEffect, useState } from "react";
import { Button } from "@mui/material";
import { Loading, UserHelper, ApiHelper, Locale } from "@churchapps/apphelper";
import { FormSubmissionEdit } from "@churchapps/apphelper/forms";
import type { ChurchInterface } from "@churchapps/helpers";

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
  displayMode?: "standard" | "conversational";
}

export const FormElement = (props: Props) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [addFormId, setAddFormId] = useState<string>("");
  const [isFormSubmitted, setIsFormSubmitted] = useState<boolean>(false);
  const [unRestrictedFormId, setUnRestrictedFormId] = useState<string>("");
  const formId = props.element.answers?.formId;
  const [form, setForm] = useState<FormInterface | undefined>(undefined);

  useEffect(() => {
    if (formId && props.church) {
      loadData();
    }
  }, [formId, props.church]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const formData = await ApiHelper.get("/forms/standalone/" + formId + "?churchId=" + props.church.id, "MembershipApi") as FormInterface;
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
        {form?.thankYouMessage ? form.thankYouMessage : Locale.label("elements.formSubmitted")}
        <Button
          variant="text"
          size="small"
          onClick={() => setIsFormSubmitted(false)}
          data-testid="form-fill-again-button"
        >
          {Locale.label("elements.fillAgain")}
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
        displayMode={form?.displayMode}
        updatedFunction={handleUpdate}
        showHeader={false}
        noBackground={true}
      />
    </>
  );
};
