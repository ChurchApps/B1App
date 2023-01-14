import { useState } from "react";
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Table, TableCell, TableRow } from "@mui/material";
import React from "react";

type Props = {
  parsedData: any;
  onRealtimeChange: (parsedData: any) => void;
};

export function RowEdit(props: Props) {
  const cols: number[] = []
  props.parsedData.columns?.split(",").forEach((c: string) => cols.push(parseInt(c)));
  console.log("**PARSED DATA", props.parsedData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    e.preventDefault();
    const data = { ...props.parsedData };
    if (e.target.name === "columns") data.columns = e.target.value;
    props.onRealtimeChange(data)
  };

  const PreviewTable = () => {
    const colors = ["#FBF8CC", "#FDE4CF", "#FFCFD2", "#F1C0E8", "#CFBAF0", "#A3C4F3", "#90DBF4", "#8EECF5", "#98F5E1", "B9FBC0", "#FBF8CC", "#FDE4CF"]
    let result: JSX.Element[] = [];
    let idx = 0;
    cols.forEach(c => {
      result.push(<TableCell key={idx} style={{ backgroundColor: colors[idx], width: Math.round(c / 12).toString() + "%" }} colSpan={c}>{c}</TableCell>)
      idx++;
    });
    return (<Table size="small">
      <TableRow>
        {result}
      </TableRow>
    </Table>);
  }

  return (
    <>
      <FormControl fullWidth>
        <InputLabel>Common Options</InputLabel>
        <Select name="columns" fullWidth label={"Common Options"} value={props.parsedData?.columns || ""} onChange={handleChange}>
          <MenuItem value="6,6">Halves</MenuItem>
          <MenuItem value="4,4,4">Thirds</MenuItem>
          <MenuItem value="3,3,3,3">Quarters</MenuItem>
        </Select>
      </FormControl>
      <div><b>Preview</b> - <small>Numbers represent twelfths of page.</small></div>

      <PreviewTable />
    </>
  );


}