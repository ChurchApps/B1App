import React, { useState, useEffect, useRef } from "react";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import { InputBox, SmallButton } from ".";

interface Props {
  title?: string;
  photoUrl: string;
  aspectRatio: number;
  onUpdate: (dataUrl?: string) => void;
  onCancel: () => void;
}

export function ImageEditor({ title = "Crop", photoUrl, aspectRatio, onUpdate, onCancel }: Props) {
  const [photoSrc, setPhotoSrc] = useState<string>("");
  const [croppedImageDataUrl, setCroppedImageDataUrl] = useState<string>("");
  const cropperRef = useRef<HTMLImageElement>(null);
  let timeout: any = null;

  const handleSave = () => onUpdate(croppedImageDataUrl);

  const handleDelete = () => onUpdate("");

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    let files;
    if (e.target) {
      files = e.target.files;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result.toString();
      setPhotoSrc(url);
      setCroppedImageDataUrl(url);
    };
    reader.readAsDataURL(files[0]);
  };

  const handleCrop = () => {
    if (timeout !== null) {
      window.clearTimeout(timeout);
      timeout = null;
    }

    timeout = window.setTimeout(() => {
      if (cropperRef.current !== null) {
        const imageElement: any = cropperRef?.current;
        const cropper: any = imageElement?.cropper;

        const url = cropper.getCroppedCanvas({ width: 400, height: 300 }).toDataURL();
        setCroppedImageDataUrl(url);
      }
    }, 200);
  };

  useEffect(() => {
    setPhotoSrc(photoUrl);
  }, [photoUrl]);

  return (
    <InputBox
      id="cropperBox"
      headerIcon=""
      headerText={title}
      ariaLabelDelete="deletePhoto"
      saveText="Update"
      saveFunction={handleSave}
      cancelFunction={onCancel}
      deleteFunction={handleDelete}
      headerActionContent={
        <div>
          <input type="file" onChange={handleUpload} id="fileUpload" accept="image/*" style={{ display: "none" }} />
          <SmallButton
            icon="upload"
            text="Upload"
            onClick={() => {
              document.getElementById("fileUpload").click();
            }}
          />
        </div>
      }
    >
      <Cropper
        ref={cropperRef}
        src={photoSrc}
        style={{ height: 240, width: "100%" }}
        aspectRatio={aspectRatio}
        guides={false}
        crop={handleCrop}
      />
    </InputBox>
  );
}
