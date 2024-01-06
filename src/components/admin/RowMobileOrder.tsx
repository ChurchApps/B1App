import { MenuItem, Select, SelectChangeEvent, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import React from "react";

type Props = {
  cols: number[]
  parsedData: any;
  onRealtimeChange: (parsedData: any) => void;
};

export function RowMobileOrder(props: Props) {
  const mobileOrder: number[] = []
  props.parsedData.columns?.split(",").forEach((c: string, idx:number) => mobileOrder.push(idx+1));
  props.parsedData.mobileOrder?.split(",").forEach((c: string, idx:number) => mobileOrder[idx] = parseInt(c));

  const updateMobileOrders = () => {
    const data = { ...props.parsedData };
    data.mobileOrder = mobileOrder.toString();
    props.onRealtimeChange(data);
  }

  const handleColumnChange = (e: SelectChangeEvent<number>, idx: number) => {
    const val = parseInt(e.target.value.toString());
    mobileOrder[idx] = val;
    updateMobileOrders();
  }

  const getCustomOrders = () => {
    let result: JSX.Element[] = [];
    props.cols.forEach((c:number, idx:number) => {
      const index = idx;
      let order = (mobileOrder.length > idx) ? mobileOrder[idx] || idx + 1 : idx + 1;
      result.push(<TableRow key={idx}>
        <TableCell>{idx+1}</TableCell>
        <TableCell>
          <Select name="width" fullWidth size="small" value={order} onChange={(e) => handleColumnChange(e, index)}>
            <MenuItem value="1">1</MenuItem>
            <MenuItem value="2">2</MenuItem>
            <MenuItem value="3">3</MenuItem>
            <MenuItem value="4">4</MenuItem>
            <MenuItem value="5">5</MenuItem>
            <MenuItem value="6">6</MenuItem>
            <MenuItem value="7">7</MenuItem>
            <MenuItem value="8">8</MenuItem>
            <MenuItem value="9">9</MenuItem>
            <MenuItem value="10">10</MenuItem>
            <MenuItem value="11">11</MenuItem>
            <MenuItem value="12">12</MenuItem>
          </Select>
        </TableCell>
      </TableRow>)
    });

    return (<>
      <div style={{marginTop:10}}><b>Customize Mobile Order</b></div>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Desktop Order</TableCell>
            <TableCell>Mobile Order</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {result}
        </TableBody>
      </Table><br /></>);
  }

  return (
    <>
      {getCustomOrders()}
    </>
  );


}
