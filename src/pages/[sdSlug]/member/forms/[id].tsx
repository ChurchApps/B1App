import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ConfigHelper, ApiHelper, PersonHelper, DateHelper, WrapperPageProps } from "@/helpers";
import { Wrapper, Loading, FormSubmissionEdit } from "@/components";
import { GetStaticPaths, GetStaticProps } from "next";

export default function Form(props: WrapperPageProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFormSubmitted, setIsFormSubmitted] = useState<boolean>(false);
  const [restrictedForm, setRestrictedForm] = useState<boolean>(true);
  const [early, setEarly] = useState<Date>(null);
  const [late, setLate] = useState<Date>(null);
  const [addFormId, setAddFormId] = useState<string>("");
  const [unRestrictedFormId, setUnRestrictedFormId] = useState<string>("");
  const router = useRouter();
  const formId = router.query.id as string;

  const loadData = () => {
    setIsLoading(true);
    ApiHelper.get("/forms/standalone/" + formId + "?churchId=" + props.config.church.id, "MembershipApi").then(
      (data) => {
        let now = new Date().setHours(0, 0, 0, 0);
        let start = data.accessStartTime ? new Date(data.accessStartTime) : null;
        let end = data.accessEndTime ? new Date(data.accessEndTime) : null;
        if (start && start.setHours(0, 0, 0, 0) > now) setEarly(start);
        if (end && end.setHours(0, 0, 0, 0) < now) setLate(end);
        setRestrictedForm(data.restricted);
        if (data.restricted) setAddFormId(formId);
        else setUnRestrictedFormId(formId);
        setIsLoading(false);
      }
    );
  };

  const handleUpdate = () => setIsFormSubmitted(true);

  const showForm = () => (
    <FormSubmissionEdit
      churchId={props.config.church.id}
      addFormId={addFormId}
      unRestrictedFormId={unRestrictedFormId}
      contentType="form"
      contentId={formId}
      formSubmissionId=""
      personId={PersonHelper?.person?.id}
      updatedFunction={handleUpdate}
      cancelFunction={() => router.push("/")}
      sendEmail={true}
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
          <Link href={"/login?returnUrl=/forms/" + formId}>Login</Link> to view this form.
        </h3>
      );
    return <></>;
  };

  useEffect(loadData, [formId]);

  return (
    <Wrapper config={props.config}>
      {isFormSubmitted ? <h3 className="text-center">Your form has been successfully submitted.</h3> : getForm()}
    </Wrapper>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths:any[] = [];
  return { paths, fallback: "blocking", };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const config = await ConfigHelper.load(params.sdSlug.toString());
  return { props: { config }, revalidate: 30 };
};
