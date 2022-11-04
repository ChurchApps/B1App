import { useState, useEffect } from "react";
import { ErrorMessages, InputBox } from "../index";
import { ApiHelper, PageInterface, UserHelper } from "@/helpers";
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, TextField } from "@mui/material";
import { ImageEditor } from "@/appBase/components/ImageEditor";
import UserContext from "@/helpers/UserContext";

type Props = {
  page: PageInterface;
  updatedCallback: (page: PageInterface) => void;
};

export function PageEdit(props: Props) {
  const [page, setPage] = useState<PageInterface>(null);
  const [errors, setErrors] = useState([]);
  const [showImageEditor, setShowImageEditor] = useState<boolean>(false);

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

  const handleImageUpdated = (dataUrl: string) => {
    const p = { ...page };
    p.headerImage = dataUrl;
    setPage(p);
    setShowImageEditor(false);
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

  const handleImageClick = (e: React.MouseEvent) => { e.preventDefault(); setShowImageEditor(true); };

  useEffect(() => { setPage(props.page); }, [props.page]);

  const getImageEditor = () => {
    if (showImageEditor) return (<ImageEditor onUpdate={handleImageUpdated} photoUrl={page.headerImage} onCancel={() => setShowImageEditor(false)} aspectRatio={4 / 1} />);
  };

  if (!page) return <></>
  else return (
    <>
      {getImageEditor()}
      <InputBox id="pageDetailsBox" headerText="Edit Page" headerIcon="school" saveFunction={handleSave} cancelFunction={handleCancel} deleteFunction={handleDelete} >
        <ErrorMessages errors={errors} />
        <a href="about:blank" className="d-block" onClick={handleImageClick}>
          <img src={page.headerImage || "/images/blank.png"} className="profilePic d-block mx-auto" id="imgPreview" alt="page" />
        </a>
        <br />
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