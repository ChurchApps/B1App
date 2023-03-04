import {ElementInterface, ConfigHelper, PersonHelper, ApiHelper} from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FormSubmissionEdit } from "@/components";

interface Props {
    element: ElementInterface;
}

export const FormElement = (props: Props) => {
    const [config, setConfig] = useState<ConfigurationInterface>(null);
    const [addFormId, setAddFormId] = useState<string>("");
    const [unRestrictedFormId, setUnRestrictedFormId] = useState<string>("");
    const router = useRouter();
    const formId =  props.element.answers.formId;

    useEffect(() => {
        const getConfig = async() => {
        const response = await ConfigHelper.load(router.query.sdSlug.toString());
        response && setConfig(response)
        return response            
        }
        getConfig();
    }, []);

    useEffect(() => {
        if(formId && config){
            loadData();
        }
    }, [formId, config]);

    const loadData = () => {
        ApiHelper.get("/forms/standalone/" + formId + "?churchId=" + config.church.id, "MembershipApi").then((data) => {
            if(data.restricted) setAddFormId(formId);
            else setUnRestrictedFormId(formId);
        })
    }

    if(!(config && formId && (addFormId || unRestrictedFormId))){
        return <p>Loading...</p>
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
            updatedFunction={() => {}}
            cancelFunction={() => {}}
            />
        </>
    )
}  