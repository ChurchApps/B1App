import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { TextField } from "@mui/material";
import { EditorState, convertToRaw, ContentState } from "draft-js";
import draftToHtml from "draftjs-to-html";
import { InputBox } from "@/components";
import { B1PageInterface, ApiHelper, UniqueIdHelper, EnvironmentHelper } from "@/helpers";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

const Editor = dynamic(() => import("react-draft-wysiwyg").then((mod) => mod.Editor), { ssr: false });
const htmlToDraft = typeof window === 'object' && require('html-to-draftjs').default;

interface Props {
  page: B1PageInterface;
  updatedFunction?: () => void;
}

export function PageEdit({ page: pageFromProps, updatedFunction = () => {} }: Props) {
  const [page, setPage] = useState<B1PageInterface>(null);
  const [editorState, setEditorState] = useState<EditorState>(EditorState.createEmpty());

  const handleSave = () => {
    let content = editorState.getCurrentContent();
    page.content = draftToHtml(convertToRaw(content));
    ApiHelper.post("/pages", [page], "B1Api").then(updatedFunction);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you wish to permanently delete this page?")) {
      ApiHelper.delete("/pages/" + page.id, "B1Api").then(() => {
        setPage(null);
        updatedFunction();
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = e.currentTarget.value;
    let p = { ...page };
    switch (e.currentTarget.name) {
      case "name":
        p.name = val;
        break;
      //case "type": t.tabType = val; break;
      //case "page": t.tabData = val; break;
      //case "url": t.url = val; break;
    }
    setPage(p);
  };

  const init = () => {
    setPage(pageFromProps);
    if (UniqueIdHelper.isMissing(pageFromProps.id))
      setEditorState(EditorState.createWithContent(ContentState.createFromText("")));
    else {
      const path = `${EnvironmentHelper.Common.ContentRoot}/${pageFromProps.churchId}/pages/${
        pageFromProps.id
      }.html?ts=${new Date().getTime().toString()}`;
      fetch(path)
        .then((response) => response.text())
        .then((content) => {
          const draft = htmlToDraft(content);
          setEditorState(EditorState.createWithContent(ContentState.createFromBlockArray(draft.contentBlocks)));
        });
    }
  };

  useEffect(init, [pageFromProps]);

  return (
    <InputBox
      headerIcon="code"
      headerText="Edit Page"
      saveFunction={handleSave}
      cancelFunction={updatedFunction}
      deleteFunction={!UniqueIdHelper.isMissing(page?.id) ? handleDelete : null}
    >
      <TextField fullWidth label="Page Name" name="name" value={page?.name || ""} onChange={handleChange} />
      <label>Contents</label>
      {/* 
        // @ts-ignore */}
      <Editor editorState={editorState} onEditorStateChange={(e) => setEditorState(e)} editorStyle={{ height: 200 }} />
    </InputBox>
  );
}
