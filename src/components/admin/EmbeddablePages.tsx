import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { DisplayBox } from "@/components";
import { SmallButton } from "@/appBase/components";
import { PageInterface, ApiHelper } from "@/helpers";

type Props = {
  onSelected: (page:PageInterface) => void
};

export function EmbeddablePages(props:Props) {
  const { isAuthenticated } = ApiHelper;
  const [pages, setPages] = useState<PageInterface[]>([]);
  const router = useRouter();

  // redirect to login when not authenticated
  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated]);

  const loadData = () => {
    if (!isAuthenticated) { return; }
    ApiHelper.get("/pages", "ContentApi").then((p) => setPages(p || []));
  };

  useEffect(loadData, [isAuthenticated]);

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

  const editContent = (<SmallButton icon="add" onClick={() => { props.onSelected( {} ) }} /> );

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