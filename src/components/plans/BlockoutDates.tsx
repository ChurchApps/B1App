import React, { useEffect } from "react";
import { ApiHelper } from "@churchapps/apphelper";
import { DateHelper } from "@churchapps/apphelper";
import { DisplayBox } from "@churchapps/apphelper";
import type { BlockoutDateInterface } from "@churchapps/helpers";
import { TableRow, TableCell, Table, TableHead, TableBody, IconButton, Icon } from "@mui/material";
import { BlockoutDateEdit } from "./BlockoutDateEdit";

interface Props {
}

export const BlockoutDates: React.FC<Props> = (props) => {
  const [blockoutDates, setBlockoutDates] = React.useState<BlockoutDateInterface[]>([]);
  const [blockoutDate, setBlockoutDate] = React.useState<BlockoutDateInterface>(null);

  const loadData = () => {
    ApiHelper.get("/blockoutDates/my", "DoingApi").then((data: any) => setBlockoutDates(data));
    setBlockoutDate(null);
  }

  useEffect(() => { loadData(); }, []);


  const getRows = () => {

    const rows:React.ReactElement[] = [];
    blockoutDates.forEach((d) => {
      rows.push(
        <TableRow key={d.id}>
          <TableCell>{DateHelper.prettyDate(new Date(d.startDate))}</TableCell>
          <TableCell>{DateHelper.prettyDate(new Date(d.endDate))}</TableCell>
          <TableCell>
            <IconButton onClick={() => setBlockoutDate(d)}><Icon>edit</Icon></IconButton>
          </TableCell>
        </TableRow>
      );
    });
    return rows;
  }

  const handleAdd = () => {
    setBlockoutDate({ startDate: new Date(), endDate: new Date() });
  }

  const addLink = <IconButton onClick={handleAdd}><Icon color="primary">add</Icon></IconButton>

  if (blockoutDate !== null) return (<BlockoutDateEdit blockoutDate={blockoutDate} onUpdate={loadData} />);
  else return (<DisplayBox headerIcon="block" headerText="Blockout Dates" editContent={addLink}>
    {blockoutDates.length === 0 && <div>No blockout dates.</div>}
    {blockoutDates.length > 0 && (<Table>
      <TableHead>
        <TableRow>
          <TableCell>Start Date</TableCell>
          <TableCell>End Date</TableCell>
          <TableCell></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {getRows()}
      </TableBody>
    </Table>)}
  </DisplayBox>);
}

