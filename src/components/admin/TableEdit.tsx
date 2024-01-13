import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, TextField } from "@mui/material";
import React from "react";

type Props = {
  parsedData: any;
  onRealtimeChange: (parsedData: any) => void;
};

export function TableEdit(props: Props) {
  const contents:string[][] = props.parsedData.contents || [["",""],["",""],["",""],["",""]];
  const rows = contents.length;
  const cols = (contents.length>0) ? contents[0].length : 0;

  const updateRows = (newRows: number) => {
    let c = [...contents];
    if (newRows > rows) {
      for (let i = rows; i < newRows; i++) c.push(new Array(cols).fill(""));
    } else c.splice(newRows, rows - newRows);
    return c;
  }

  const updateCols = (newCols: number) => {
    let c = [...contents];
    for (let i = 0; i < c.length; i++) {
      if (newCols > cols) {
        for (let j = cols; j < newCols; j++) c[i].push("");
      } else c[i].splice(newCols, cols - newCols);
    }
    return c;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    e.preventDefault();
    const data = { ...props.parsedData };
    if (e.target.name === "rows") data.contents = updateRows(parseInt(e.target.value));
    if (e.target.name === "columns") data.contents = updateCols(parseInt(e.target.value));
    if (e.target.name === "head") data.head = (e.target.value === "true");
    if (e.target.name === "size") data.size = e.target.value;
    if (e.target.name.startsWith("cell-")) {
      const parts = e.target.name.split("-");
      const row = parseInt(parts[1]);
      const col = parseInt(parts[2]);
      const c = [...contents];
      c[row][col] = e.target.value;
      data.contents = c;
    }
    props.onRealtimeChange(data)
  };

  const getGrid = () => {
    let result: JSX.Element[] = [];
    for (let i = 0; i < rows; i++) {
      let row: JSX.Element[] = [];
      for (let j = 0; j < cols; j++) {
        row.push(<td key={j}><TextField fullWidth size="small" label="" style={{margin:0}} name={"cell-" + i + "-" + j} value={contents[i][j]} onChange={handleChange} /></td>);
      }
      result.push(<tr key={i}>{row}</tr>);
    }
    return (<table><tbody>{result}</tbody></table>);
  }


  return (
    <>
      <TextField fullWidth size="small" label="Rows" name="rows" value={rows} onChange={handleChange} />
      <TextField fullWidth size="small" label="Columns" name="columns" value={cols} onChange={handleChange} />
      <FormControl fullWidth size="small">
        <InputLabel>First Row is Header</InputLabel>
        <Select fullWidth label="First Row is Header" size="small" name="head" value={props.parsedData.head?.toString() || "false"} onChange={handleChange}>
          <MenuItem value="true">Yes</MenuItem>
          <MenuItem value="false">No</MenuItem>
        </Select>
      </FormControl>
      <FormControl fullWidth size="small">
        <InputLabel>Size</InputLabel>
        <Select fullWidth label="Size" size="small" name="size" value={props.parsedData.size?.toString() || "medium"} onChange={handleChange}>
          <MenuItem value="medium">Medium</MenuItem>
          <MenuItem value="small">Small</MenuItem>
        </Select>
      </FormControl>
      {getGrid()}
    </>
  );

}
