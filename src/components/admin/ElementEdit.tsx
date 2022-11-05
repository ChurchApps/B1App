import { useState, useEffect } from "react";
import { ErrorMessages, InputBox } from "../index";
import { ApiHelper, ElementInterface, UserHelper } from "@/helpers";
import { SelectChangeEvent, TextField } from "@mui/material";

type Props = {
  element: ElementInterface;
  updatedCallback: (element: ElementInterface) => void;
};

export function ElementEdit(props: Props) {
  const [element, setElement] = useState<ElementInterface>(null);
  const [errors, setErrors] = useState([]);

  const handleCancel = () => props.updatedCallback(element);
  const handleKeyDown = (e: React.KeyboardEvent<any>) => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    e.preventDefault();
    let p = { ...element };
    const val = e.target.value;
    switch (e.target.name) {
      case "elementType": p.elementType = val; break;
      case "answersJSON": p.answersJSON = val; break;
    }
    setElement(p);
  };

  const validate = () => {
    let errors = [];
    setErrors(errors);
    return errors.length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      ApiHelper.post("/elements", [element], "ContentApi").then((data) => {
        setElement(data);
        props.updatedCallback(data);
      });
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you wish to permanently delete this element?")) {
      ApiHelper.delete("/elements/" + element.id.toString(), "ContentApi").then(() => props.updatedCallback(null));
    }
  };

  useEffect(() => { setElement(props.element); }, [props.element]);

  if (!element) return <></>
  else return (
    <>
      <InputBox id="elementDetailsBox" headerText="Edit Element" headerIcon="school" saveFunction={handleSave} cancelFunction={handleCancel} deleteFunction={handleDelete} >
        <ErrorMessages errors={errors} />
        <br />
        <TextField fullWidth label="Background" name="background" value={element.elementType} onChange={handleChange} onKeyDown={handleKeyDown} />
        <TextField fullWidth label="Answers JSON" name="answersJSON" value={element.answersJSON} onChange={handleChange} onKeyDown={handleKeyDown} multiline />
      </InputBox>
    </>
  );
}