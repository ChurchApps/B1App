"use client";
import { useState, useEffect } from "react";
import axios, { type AxiosProgressEvent } from "axios";
import { LinearProgress } from "@mui/material";
import { ApiHelper } from "@churchapps/apphelper";
import { FileInterface } from "@/helpers";

type Props = {
  pendingSave: boolean;
  saveCallback: (file: FileInterface) => void;
  contentType:string;
  contentId:string;
};

export function FileUpload(props: Props) {
  const [file, setFile] = useState<FileInterface>({} as FileInterface);
  const [uploadedFile, setUploadedFile] = useState<File>({} as File);
  const [uploadProgress, setUploadProgress] = useState(-1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const convertBase64 = () => new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.readAsDataURL(uploadedFile);
    fileReader.onload = () => { resolve(fileReader.result); };
    fileReader.onerror = (error) => { reject(error); };
  });

  const handleSave = async () => {
    const f = { ...file };
    f.size = uploadedFile.size;
    f.fileType = uploadedFile.type;
    f.fileName = uploadedFile.name;
    f.contentType = props.contentType;
    f.contentId = props.contentId;
    const preUploaded: boolean = await preUpload();
    if (!preUploaded) {
      const base64 = await convertBase64();
      f.fileContents = base64 as string;
    }
    const data: FileInterface[] = await ApiHelper.post("/files", [f], "ContentApi");
    setFile({});
    setUploadedFile({} as File);
    const el = document.getElementById("fileUpload") as HTMLInputElement | null;
    if (el) el.value = "";
    props.saveCallback(data[0]);
  };

  const checkSave = () => {
    if (props.pendingSave) {
      if (uploadedFile.size > 0) handleSave();
      else props.saveCallback(file);
    }
  };

  const preUpload = async () => {
    const params = { fileName: uploadedFile.name, contentType:props.contentType, contentId:props.contentId };
    const presigned = await ApiHelper.post("/files/postUrl", params, "ContentApi");
    const doUpload = presigned.key !== undefined;
    if (doUpload) await postPresignedFile(presigned);
    return doUpload;
  };

  interface PresignedResponse {
    url: string;
    key?: string;
    fields: Record<string, string>;
  }

  const postPresignedFile = (presigned: PresignedResponse) => {
    const formData = new FormData();
    formData.append("acl", "public-read");
    formData.append("Content-Type", uploadedFile.type);
    for (const property in presigned.fields)
      formData.append(property, presigned.fields[property]);
    const f = document.getElementById("fileUpload") as HTMLInputElement | null;
    if (f?.files?.[0]) formData.append("file", f.files[0]);

    const axiosConfig = {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total) {
          setUploadProgress(Math.round((100 * progressEvent.loaded) / progressEvent.total));
        }
      },
    };

    return axios.post(presigned.url, formData, axiosConfig);
  };

  useEffect(checkSave, [props.pendingSave]);

  const getFileLink = () => {
    if (uploadProgress > -1 && props.pendingSave) return <LinearProgress value={uploadProgress} />;
    else if (file) return (<div><a href={file.contentPath}>{file.fileName}</a></div>);
  };

  return (
    <>
      <label>File</label>
      {getFileLink()}
      <input id="fileUpload" type="file" onChange={handleChange} />
    </>
  );
}
