import { useState, useEffect } from "react";
import { ErrorMessages, InputBox } from "../index";
import { ApiHelper, SectionInterface, UserHelper } from "@/helpers";
import { SelectChangeEvent, TextField } from "@mui/material";

type Props = {
  section: SectionInterface;
  updatedCallback: (section: SectionInterface) => void;
};

export function SectionEdit(props: Props) {
  const [section, setSection] = useState<SectionInterface>(null);
  const [errors, setErrors] = useState([]);

  const handleCancel = () => props.updatedCallback(section);
  const handleKeyDown = (e: React.KeyboardEvent<any>) => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    e.preventDefault();
    let p = { ...section };
    const val = e.target.value;
    switch (e.target.name) {
      //case "title": p.title = val; break;
      //case "url": p.url = val; break;
    }
    setSection(p);
  };

  const validate = () => {
    let errors = [];
    //if (section.url === "") errors.push("Please enter a path.");
    //if (section.title === "") errors.push("Please enter a title.");
    setErrors(errors);
    return errors.length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      ApiHelper.post("/sections", [section], "ContentApi").then((data) => {
        setSection(data);
        props.updatedCallback(data);
      });
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you wish to permanently delete this section?")) {
      ApiHelper.delete("/sections/" + section.id.toString(), "ContentApi").then(() => props.updatedCallback(null));
    }
  };

  useEffect(() => { setSection(props.section); }, [props.section]);

  if (!section) return <></>
  else return (
    <>
      <InputBox id="sectionDetailsBox" headerText="Edit Section" headerIcon="school" saveFunction={handleSave} cancelFunction={handleCancel} deleteFunction={handleDelete} >
        <ErrorMessages errors={errors} />

        <br />
        <TextField fullWidth label="Title" name="title" value={section.textColor} onChange={handleChange} onKeyDown={handleKeyDown} />
        <TextField fullWidth label="Url Path" name="url" value={section.background} onChange={handleChange} onKeyDown={handleKeyDown} />
      </InputBox>
    </>
  );
}