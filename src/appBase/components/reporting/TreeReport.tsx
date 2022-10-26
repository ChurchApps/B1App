import React from "react";
import { ColumnInterface, ReportOutputInterface, ReportResultInterface } from "../../interfaces"
import { DateHelper } from "../../helpers"
import { Table, TableBody, TableRow, TableCell, TableHead } from "@mui/material"

interface Props { reportResult: ReportResultInterface, output: ReportOutputInterface }

export const TreeReport = (props: Props) => {

  const getPreviousGroupingCount = (depth: number) => {
    let result = 0;
    for (let i = 0; i < depth; i++) result += props.output.groupings[i];
    return result;
  }

  let totalGroupings = getPreviousGroupingCount(props.output.groupings.length);

  const getHeaders = () => {
    const result: JSX.Element[] = []
    const columns = props.output.columns;
    for (let i = totalGroupings; i < columns.length; i++) {
      const c = columns[i];
      if (i === totalGroupings) result.push(<th key={i}>{c.header}</th>);
      else result.push(<th key={i}>{c.header}</th>);
    }
    return result;
  }

  const getRows = () => {
    const result: JSX.Element[] = []
    const columns = props.output.columns;
    let previousData = {}
    props.reportResult.table.forEach(d => {
      const row: JSX.Element[] = [];
      const groupingRows: JSX.Element[] = getGroupingRows(previousData, d);
      groupingRows.forEach(gr => result.push(gr));
      for (let i = totalGroupings; i < columns.length; i++) {
        const c = columns[i];
        if (i === totalGroupings) row.push(<TableCell style={{ paddingLeft: 30 * totalGroupings }}>{getField(c, d)}</TableCell>);
        else row.push(<TableCell>{getField(c, d)}</TableCell>);
      }
      result.push(<TableRow>{row}</TableRow>);
      previousData = d;
    });
    return result;
  }

  const getGroupingRows = (previousData: any, data: any) => {
    const result: JSX.Element[] = [];
    let firstGroupModified = getFirstGroupModified(previousData, data);
    for (let i = firstGroupModified; i <= props.output.groupings.length; i++) {
      result.push(getGroupingRow(data, i))
    }
    return result;
  }

  const getGroupingRow = (row: any, groupNumber: number) => {
    const g = props.output.groupings[groupNumber];
    const prevCols = getPreviousGroupingCount(groupNumber);
    const outputRow: JSX.Element[] = [];
    for (let i = prevCols; i < prevCols + g; i++) {
      const c = props.output.columns[i];
      const className = "heading" + (groupNumber + 1);
      if (i === prevCols && i > 0) outputRow.push(<TableCell className={className} style={{ paddingLeft: 30 * groupNumber }}>{getField(c, row)}</TableCell>);
      else outputRow.push(<TableCell className={className}>{getField(c, row)}</TableCell>);
    }
    return (<TableRow>{outputRow}</TableRow>);
  }

  const getFirstGroupModified = (previousRow: any, row: any) => {
    let firstColumnModified = props.output.columns.length - 1;
    for (let i = props.output.columns.length - 1; i >= 0; i--) {
      const colName = props.output.columns[i].value;
      if (row[colName] !== previousRow[colName]) {
        firstColumnModified = i;
      }
    }

    let firstGroupModified = props.output.groupings.length;
    for (let i = props.output.groupings.length - 1; i >= 0; i--) {
      let totalColumns = getPreviousGroupingCount(i);
      if (totalColumns >= firstColumnModified) firstGroupModified = i;
    }

    return firstGroupModified;
  }

  const getField = (column: ColumnInterface, dataRow: any) => {
    let result = dataRow[column.value].toString() || "";
    switch (column.formatter) {
      case "date":
        let dt = new Date(result);
        result = DateHelper.prettyDate(dt);
        break;
    }
    return result;
  }

  return (
    <Table className="table table-sm report">
      <TableHead className="thead-dark">
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
