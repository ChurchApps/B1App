import React from "react";
import { ColumnInterface, ReportOutputInterface, ReportResultInterface } from "../../interfaces";
import { DateHelper } from "../../helpers";
import { Table, TableBody, TableRow, TableCell, TableHead } from "@mui/material";

interface Props { reportResult: ReportResultInterface, output: ReportOutputInterface }

export const TableReport = (props: Props) => {

  const getHeaders = () => {
    const result: JSX.Element[] = []
    props.output.columns.forEach((c, i) => {
      result.push(<th key={i}>{c.header}</th>);
    })
    return result;
  }

  const getRows = () => {
    const result: JSX.Element[] = []
    props.reportResult.table.forEach(d => {
      const row: JSX.Element[] = [];
      props.output.columns.forEach(c => {
        row.push(<TableCell>{getField(c, d)}</TableCell>);
      })
      result.push(<TableRow>{row}</TableRow>);
    });
    return result;
  }

  const getField = (column: ColumnInterface, dataRow: any) => {
    let result = ""
    try {
      result = dataRow[column.value]?.toString() || "";
    } catch { }

    switch (column.formatter) {
      case "date":
        let dt = new Date(result);
        result = DateHelper.prettyDate(dt);
        break;
    }
    return result;
  }

  return (
    <Table className="table">
      <TableHead>
        <TableRow>
          {getHeaders()}
        </TableRow>
      </TableHead>
      <TableBody>
        {getRows()}
      </TableBody>
    </Table>
  );
}
