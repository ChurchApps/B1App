import { useState, useEffect } from "react";
import { ErrorMessages, InputBox } from "../index";
import { ApiHelper, PageInterface, UserHelper } from "@/helpers";
import { SelectChangeEvent, TextField } from "@mui/material";

type Props = {
  page: PageInterface;
  updatedCallback: (page: PageInterface) => void;
};

export function PageEdit(props: Props) {
  const [page, setPage] = useState<PageInterface>(null);
  const [errors, setErrors] = useState([]);

  const handleCancel = () => props.updatedCallback(page);
  const handleKeyDown = (e: React.KeyboardEvent<any>) => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    e.preventDefault();
    let p = { ...page };
    const val = e.target.value;
    switch (e.target.name) {
      case "title": p.title = val; break;
      case "url": p.url = val; break;
    }
    setPage(p);
  };

  const validate = () => {
    let errors = [];
    if (page.url === "") errors.push("Please enter a path.");
    if (page.title === "") errors.push("Please enter a title.");
    setErrors(errors);
    return errors.length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      ApiHelper.post("/pages", [page], "ContentApi").then((data) => {
        setPage(data);
        props.updatedCallback(data);
      });
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you wish to permanently delete this page?")) {
      ApiHelper.delete("/pages/" + page.id.toString(), "ContentApi").then(() => props.updatedCallback(null));
    }
  };

  useEffect(() => { setPage(props.page); }, [props.page]);

  if (!page) return <></>
  else return (
    <>
      <InputBox id="pageDetailsBox" headerText="Edit Page" headerIcon="school" saveFunction={handleSave} cancelFunction={handleCancel} deleteFunction={handleDelete} >
        <ErrorMessages errors={errors} />
        <TextField fullWidth label="Title" name="title" value={page.title} onChange={handleChange} onKeyDown={handleKeyDown} />
        <TextField fullWidth label="Url Path" name="url" value={page.url} onChange={handleChange} onKeyDown={handleKeyDown} />
        <div>
          <a href={`https://${UserHelper.currentChurch.subDomain}.yoursite.church${page.url}`} target="_blank" rel="noopener noreferrer">
            {`https://${UserHelper.currentChurch.subDomain}.yoursite.church${page.url}`}
          </a>
        </div>
      </InputBox>
    </>
  );
}