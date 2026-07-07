"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PersonHelper, WrapperPageProps } from "@/helpers";
import { Loading } from "@churchapps/apphelper";
import { FormSubmissionEdit } from "@churchapps/apphelper/forms";
import { DateHelper } from "@churchapps/apphelper";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import type { FormInterface } from "@churchapps/helpers";
import { Container } from "@mui/material";

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

  const loadData = async () => {
    setIsLoading(true);

    const data = await ApiHelper.get("/forms/standalone/" + props.formId + "?churchId=" + props.config.church.id, "MembershipApi") as FormInterface;
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
      displayMode={(form as any)?.displayMode}
      updatedFunction={handleUpdate}
      cancelFunction={() => redirect("/")}
    />
  );

  const getForm = () => {
    if (isLoading) return <Loading />;
    if (early) return <h3 className="text-center">{Locale.label("pageSlug.formNotAvailableUntil").replace("{}", DateHelper.prettyDateTime(early))}</h3>;
    if (late) return <h3 className="text-center">{Locale.label("pageSlug.formClosedOn").replace("{}", DateHelper.prettyDateTime(late))}</h3>;
    if (!restrictedForm || PersonHelper?.person?.id) return showForm();
    if (!PersonHelper?.person?.id) {
      return (
        <h3 className="text-center">
          <Link href={"/login?returnUrl=/forms/" + props.formId} data-testid="form-login-link">{Locale.label("login.login")}</Link> {Locale.label("pageSlug.toViewForm")}
        </h3>
      );
    }
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
            <h3 className="text-center">{Locale.label("pageSlug.formSubmitted")}</h3>
          )
          : (
            getForm()
          )}
      </Container>
    </>
  );
}
