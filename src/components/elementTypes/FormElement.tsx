import { useEffect, useState } from "react";
import { Button } from "@mui/material";
import { ElementInterface, PersonHelper } from "@/helpers";
import { Loading, FormSubmissionEdit, ApiHelper, ChurchInterface } from "@churchapps/apphelper";

interface Props {
  element: ElementInterface;
  church: ChurchInterface;
}

export interface FormInterface { id?: string, name?: string, contentType?: string, restricted?: boolean, accessStartTime?: Date, accessEndTime?: Date, archived: boolean, action?: string, thankYouMessage?: string }

export const FormElement = (props: Props) => {
  const [addFormId, setAddFormId] = useState<string>("");
  const [isFormSubmitted, setIsFormSubmitted] = useState<boolean>(false);
  const [unRestrictedFormId, setUnRestrictedFormId] = useState<string>("");
  const formId = props.element.answers.formId;
  const [form, setForm] = useState<FormInterface>(null);


  useEffect(() => {
    if (formId && props.church) {
      loadData();
    }
  }, [formId, props.church]);

  const loadData = () => {
    ApiHelper.get(
      "/forms/standalone/" + formId + "?churchId=" + props.church.id,
      "MembershipApi"
    ).then((data) => {
      if (data.restricted) setAddFormId(formId);
      else setUnRestrictedFormId(formId);
      setForm(data);
    });
  };

  const handleUpdate = () => setIsFormSubmitted(true);

  if (!(props.church && formId && (addFormId || unRestrictedFormId))) {
    return <Loading />;
  }

  if (isFormSubmitted) {
    return (
      <p>
        {form.thankYouMessage ? form.thankYouMessage : "Your form has been successfully submitted."}
        <Button
          variant="text"
          size="small"
          onClick={() => setIsFormSubmitted(false)}
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
        personId={PersonHelper?.person?.id}
        updatedFunction={handleUpdate}
        showHeader={false}
        noBackground={true}
      />
    </>
  );
};
