import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@mui/material";
import { ElementInterface, ConfigHelper, PersonHelper } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { Loading, FormSubmissionEdit, ApiHelper } from "@churchapps/apphelper";

interface Props {
  element: ElementInterface;
}

export const FormElement = (props: Props) => {
  const [config, setConfig] = useState<ConfigurationInterface>(null);
  const [addFormId, setAddFormId] = useState<string>("");
  const [isFormSubmitted, setIsFormSubmitted] = useState<boolean>(false);
  const [unRestrictedFormId, setUnRestrictedFormId] = useState<string>("");
  const router = useRouter();
  const formId = props.element.answers.formId;

  useEffect(() => {
    const getConfig = async () => {
      const response = await ConfigHelper.load(router.query.sdSlug.toString());
      response && setConfig(response);
      return response;
    };
    getConfig();
  }, []);

  useEffect(() => {
    if (formId && config) {
      loadData();
    }
  }, [formId, config]);

  const loadData = () => {
    ApiHelper.get(
      "/forms/standalone/" + formId + "?churchId=" + config.church.id,
      "MembershipApi"
    ).then((data) => {
      if (data.restricted) setAddFormId(formId);
      else setUnRestrictedFormId(formId);
    });
  };

  const handleUpdate = () => setIsFormSubmitted(true);

  if (!(config && formId && (addFormId || unRestrictedFormId))) {
    return <Loading />;
  }

  if (isFormSubmitted) {
    return (
      <p>
        Your form has been successfully submitted.{" "}
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
        churchId={config.church.id}
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
