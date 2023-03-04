import {useEffect, useState} from "react";
import {ApiHelper, FormInterface} from "@/helpers";
import {FormControl, InputLabel, Select, MenuItem, SelectChangeEvent} from "@mui/material"

type Props = {
    parsedData: any
    handleChange: (e: React.ChangeEvent<HTMLInputElement> | SelectChangeEvent<string>) => void
}

export const FormEdit = (props: Props) => {
    const [forms, setForms] = useState<FormInterface[]>(null);

    useEffect(() => {
        ApiHelper.get("/forms", "MembershipApi").then(data => setForms(data));
    }, []);

    const standaloneForms = forms?.filter(form => form.contentType === "form");
    
    return (
    <>
        <FormControl fullWidth>
            <InputLabel>Select</InputLabel>
            <Select fullWidth label="Select" name="formId" onChange={props.handleChange} value={props.parsedData.formId || ""}>
                {standaloneForms?.map((form: FormInterface) => <MenuItem value={form.id}>{form.name}</MenuItem>)}
            </Select>
        </FormControl>
    </>
    )
}