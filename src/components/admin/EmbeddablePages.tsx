import { useState, useEffect } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { SmallButton } from "@churchapps/apphelper/dist/components/SmallButton";
import { DisplayBox } from "@churchapps/apphelper/dist/components/DisplayBox";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import { PageInterface } from "@/helpers";

type Props = {
  onSelected: (page:PageInterface) => void,
  pathPrefix: string,
  refreshKey?: number,
};

export function EmbeddablePages(props:Props) {
  const [pages, setPages] = useState<PageInterface[]>([]);

  const loadData = () => {
    ApiHelper.get("/pages", "ContentApi").then((_pages:PageInterface[]) => {
      let filteredPages:PageInterface[] = [];
      _pages.forEach(p => { if (p.url.startsWith(props.pathPrefix)) filteredPages.push(p); });
      setPages(filteredPages || [])
    });
  };

  useEffect(loadData, [props.refreshKey]);

  const pagesUi = pages.map((page) => (
    <TableRow key={page.id}>
      <TableCell>
        <Link href={"/admin/site/pages/" + page.id}>{page.url}</Link>
      </TableCell>
      <TableCell>
        <Link href={"/admin/site/pages/" + page.id}>{page.title}</Link>
      </TableCell>
      <TableCell align="right">
        <SmallButton icon="edit" onClick={() => { props.onSelected(page); }} />
      </TableCell>
    </TableRow>
  ));

  const editContent = (<SmallButton icon="add" onClick={() => { props.onSelected( { url:props.pathPrefix + "/page-name", layout:"embed" } ) }} /> );

  return (
    <DisplayBox headerText="Pages" headerIcon="article" editContent={editContent}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Path</TableCell>
            <TableCell>Title</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>{pagesUi}</TableBody>
      </Table>
    </DisplayBox>
  );
}
