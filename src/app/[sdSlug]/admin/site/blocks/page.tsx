"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ApiHelper, Banner, SmallButton, DisplayBox } from "@churchapps/apphelper";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { ConfigHelper, ConfigurationInterface } from "@/helpers/ConfigHelper";
import { BlockInterface } from "@/helpers";
import { TableRow, TableCell, Table, TableBody, TableHead } from "@mui/material";
import Link from "next/link";
import { BlockEdit } from "@/components/admin/BlockEdit";

type PageParams = {sdSlug:string }

export default function AdminPagesClient() {
  const [config, setConfig] = useState<ConfigurationInterface>(null);
  const [blocks, setBlocks] = useState<BlockInterface[]>([]);
  const [editBlock, setEditBlock] = useState<BlockInterface>(null);
  const params = useParams<PageParams>()

  const loadData = () => {
    ConfigHelper.load(params.sdSlug).then((data) => { setConfig(data); });
    ApiHelper.get("/blocks", "ContentApi").then((b) => {
      const filtered = b.filter((block:BlockInterface) => block.blockType !== "footerBlock");
      setBlocks(filtered || [])
    });
  };

  useEffect(() => {
    loadData();
  }, []);


  const editBlockContent = (<SmallButton icon="add" onClick={() => { setEditBlock({ blockType: "elementBlock" }); }} />);

  const blocksUi = blocks.map((block) => (
    <TableRow key={block.id}>
      <TableCell>
        <Link href={"/admin/site/blocks/" + block.id} style={{ cursor: "pointer" }}>
          {block.name}
        </Link>
      </TableCell>
      <TableCell>{block.blockType === "elementBlock" ? "Element(s)" : "Section(s)"}</TableCell>
      <TableCell align="right">
        <SmallButton
          icon="edit"
          onClick={() => {
            setEditBlock(block);
          }}
        />
      </TableCell>
    </TableRow>
  ));

  useEffect(loadData, []);


  return (
    <AdminWrapper config={config}>
      <Banner><h1>Edit Blocks</h1></Banner>
      <div id="mainContent">
        {editBlock && (
          <BlockEdit
            block={editBlock}
            updatedCallback={() => {
              setEditBlock(null);
              loadData();
            }}
          />
        )}
        <DisplayBox headerText="Reusable Blocks" headerIcon="smart_button" editContent={editBlockContent}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{blocksUi}</TableBody>
          </Table>
        </DisplayBox>
      </div>
    </AdminWrapper>
  );
}
