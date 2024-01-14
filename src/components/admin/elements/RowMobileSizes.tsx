import { MenuItem, Select, SelectChangeEvent, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import React from "react";

type Props = {
  cols: number[]
  parsedData: any;
  onRealtimeChange: (parsedData: any) => void;
};

export function RowMobileSizes(props: Props) {
  const mobileSizes: number[] = []
  props.parsedData.columns?.split(",").forEach((c: string) => mobileSizes.push(parseInt(c)));
  props.parsedData.mobileSizes?.split(",").forEach((c: string, idx:number) => mobileSizes[idx] = parseInt(c));

  const updateMobileSizes = () => {
    const data = { ...props.parsedData };
    data.mobileSizes = mobileSizes.toString();
    console.log(data);
    props.onRealtimeChange(data);
  }

  const handleColumnChange = (e: SelectChangeEvent<number>, idx: number) => {
    const val = parseInt(e.target.value.toString());
    mobileSizes[idx] = val;
    updateMobileSizes();
  }

  const getCustomSizes = () => {
    let result: JSX.Element[] = [];
    props.cols.forEach((c:number, idx:number) => {
      const index = idx;
      let mobileSize = (mobileSizes.length > idx) ? mobileSizes[idx] || c : c;
      result.push(<TableRow key={idx}>
        <TableCell>{c}</TableCell>
        <TableCell>
          <Select name="width" fullWidth size="small" value={mobileSize} onChange={(e) => handleColumnChange(e, index)}>
            <MenuItem value="1">1 - 1/12th</MenuItem>
            <MenuItem value="2">2 - 1/6th</MenuItem>
            <MenuItem value="3">3 - 1/4th</MenuItem>
            <MenuItem value="4">4 - 1/3rd</MenuItem>
            <MenuItem value="5">5 - 5/12th</MenuItem>
            <MenuItem value="6">6 - half</MenuItem>
            <MenuItem value="7">7 - 7/12th</MenuItem>
            <MenuItem value="8">8 - 2/3rd</MenuItem>
            <MenuItem value="9">9 - 3/4th</MenuItem>
            <MenuItem value="10">10 - 5/6th</MenuItem>
            <MenuItem value="11">11 - 11/12th</MenuItem>
            <MenuItem value="12">12 - whole</MenuItem>
          </Select>
        </TableCell>
      </TableRow>)
    });

    return (<>
      <div style={{marginTop:10}}><b>Customize Mobile Layout</b></div>
      <p><i>Mobile widths do not need to add up to 12.  Values that add up to 24 will span two rows.</i></p>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Desktop Width</TableCell>
            <TableCell>Mobile Width</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {result}
        </TableBody>
      </Table><br /></>);
  }

  return (
    <>
      {getCustomSizes()}
    </>
  );


}
