import React from "react";
import { ElementInterface } from "@/helpers";
import { MarkdownPreviewLight } from "@churchapps/apphelper/dist/components/markdownEditor";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";

interface Props {
  element: ElementInterface;
}

export const TableElement = ({ element }: Props) => {
  const contents = element.answers.contents || [];
  const hasHead = element.answers.head || false;
  const markdown = element.answers.markdown || false;

  const appendRow = (result:React.ReactElement[], rowArray:string[], key:string) => {
    let row: React.ReactElement[] = [];
    for (let j = 0; j < rowArray.length; j++) {
      if (markdown) row.push(<TableCell key={j}><MarkdownPreviewLight value={rowArray[j]} /></TableCell>);
      else row.push(<TableCell key={j}>{rowArray[j]}</TableCell>);
    }
    result.push(<TableRow key={key}>{row}</TableRow>);
  }

  const getHead = () => {
    let result: React.ReactElement[] = [];
    if (contents.length > 0) appendRow(result, contents[0], "head");
    return (<TableHead>{result}</TableHead>)
  }

  const getBody = () => {
    let result: React.ReactElement[] = [];
    const startIdx = hasHead ? 1 : 0;
    for (let i = startIdx; i < contents.length; i++) appendRow(result, contents[i], i.toString());
    return result;
  }

  const getTable = () => (<Table size={element.answers.size} className="pageTable">
    {hasHead && getHead()}
    <TableBody>{getBody()}</TableBody>
  </Table>)

  return <>{getTable()}</>;
};
