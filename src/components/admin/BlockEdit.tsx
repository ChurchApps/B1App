import { useState, useEffect } from "react";
import { ErrorMessages, InputBox, UserHelper, Permissions, ApiHelper } from "@churchapps/apphelper";
import { BlockInterface } from "@/helpers";
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, TextField } from "@mui/material";

type Props = {
  block: BlockInterface;
  updatedCallback: (block: BlockInterface) => void;
};

export function BlockEdit(props: Props) {
  const [block, setBlock] = useState<BlockInterface>(null);
  const [errors, setErrors] = useState([]);

  const handleCancel = () => props.updatedCallback(block);
  const handleKeyDown = (e: React.KeyboardEvent<any>) => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    e.preventDefault();
    let b = { ...block };
    const val = e.target.value;
    switch (e.target.name) {
      case "name": b.name = val; break;
      case "blockType": b.blockType = val; break;
    }
    setBlock(b);
  };

  const validate = () => {
    let errors = [];
    if (block.name === "") errors.push("Please enter a name.");
    if (!UserHelper.checkAccess(Permissions.contentApi.content.edit)) errors.push("Unauthorized to create blocks")
    setErrors(errors);
    return errors.length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      ApiHelper.post("/blocks", [block], "ContentApi").then((data) => {
        setBlock(data);
        props.updatedCallback(data);
      });
    }
  };

  const handleDelete = () => {
    let errors = [];
    if (!UserHelper.checkAccess(Permissions.contentApi.content.edit)) errors.push("Unauthorized to delete blocks");

    if (errors.length > 0) {
      setErrors(errors);
      return;
    }

    if (window.confirm("Are you sure you wish to permanently delete this block?")) {
      ApiHelper.delete("/blocks/" + block.id.toString(), "ContentApi").then(() => props.updatedCallback(null));
    }
  };

  useEffect(() => { setBlock(props.block); }, [props.block]);

  if (!block) return <></>
  else return (
    <>
      <InputBox id="blockDetailsBox" headerText="Edit Block" headerIcon="school" saveFunction={handleSave} cancelFunction={handleCancel} deleteFunction={handleDelete}>
        <ErrorMessages errors={errors} />
        <TextField fullWidth label="Name" name="name" value={block.name} onChange={handleChange} onKeyDown={handleKeyDown} />
        <FormControl fullWidth>
          <InputLabel>Block Type</InputLabel>
          <Select fullWidth label="Block Type" name="blockType" value={block.blockType} onChange={handleChange}>
            <MenuItem value="elementBlock">Element(s)</MenuItem>
            <MenuItem value="sectionBlock">Section(s)</MenuItem>
          </Select>
        </FormControl>
      </InputBox>
    </>
  );
}
