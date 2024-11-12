import React from "react";
import { LinkInterface } from "@churchapps/apphelper";
import { ConfigHelper, PageInterface } from "@/helpers";
import { PageLinkEdit } from "./site/PageLinkEdit";
import { DroppableWrapper } from "./DroppableWrapper";
import { DraggableWrapper } from "./DraggableWrapper";
import { Icon } from "@mui/material";
import Link from "next/link";

interface RecursiveInterface {
  childrenLinks: LinkInterface[];
  nestedLevel?: number;
}

interface Props {
  keyName: string;
  links: LinkInterface[];
  pages: PageInterface[];
  refresh: () => void;
  select: (link: LinkInterface, page:PageInterface) => void;
  handleDrop: (index:number, parentId:string, page:PageInterface, link:LinkInterface) => void;
}


export const SiteNavigation: React.FC<Props> = (props) => {

  //const getEditContent = () => <SmallButton icon="add" text="Add" onClick={handleAdd} />
  const [editLink, setEditLink] = React.useState<LinkInterface>(null);


  const getNestedChildren = (arr: LinkInterface[], parent: string) => {
    const result: LinkInterface[] = [];
    for(const i in arr) {
      if(arr[i].parentId == parent) {
        const children = getNestedChildren(arr, arr[i].id);
        if(children.length) {
          arr[i].children = children;
        }
        result.push(arr[i]);
      }
    }
    return result;
  }

  const structuredLinks = props.links && getNestedChildren(props.links, undefined);


  const RecursiveLinks = ({childrenLinks, nestedLevel}: RecursiveInterface) => {
    //nestedLevel shows the level of recursion based on which styling is done.
    nestedLevel = nestedLevel + 1;
    const style = {paddingLeft: (nestedLevel * 20) + "px"}
    let idx = 0;
    return (
      <>
        {childrenLinks.map((link) => {
          const page = props.pages.find(p => p.url === link.url);
          const anchor = (page)
            ? (<Link href={"/admin/site/pages/preview/" + page.id + "?linkId=" + link.id}>{link.text}</Link>)
            : (<a href="about:blank" onClick={(e) => { e.preventDefault(); setEditLink(link); }}>{link.text}</a>)
          idx++

          const index = idx-1
          let dndType = page?.id ? "navItemPage" : "navItemLink"
          if (link.children) dndType = "navItemParent"
          let accept =  ["navItemLink", "navItemPage"]
          if (nestedLevel===0) accept.push("navItemParent")
          return (<>
            <tr>
              <td style={style} data-pagetype={page?.id ? "navItemPage" : "navItemLink"}>
                {(index===0 && nestedLevel===0) && <DroppableWrapper accept={accept} onDrop={(item) => {props.handleDrop(-1, link.parentId || "", item.data.page, item.data.link)}}><div style={{height:5}}></div></DroppableWrapper>}
                <DraggableWrapper dndType={dndType} elementType={"unlinked"} data={{page, link}}>
                  {anchor}
                </DraggableWrapper>
                <DroppableWrapper accept={accept} onDrop={(item) => {props.handleDrop(index+0.5, link.parentId || "", item.data.page, item.data.link)}}><div style={{height:5}}></div></DroppableWrapper>
              </td>
              <td>
                {nestedLevel===0 && <DroppableWrapper hideWhenInactive={true} accept={["navItemLink", "navItemPage"]} onDrop={(item) => {props.handleDrop(-1, link.id || "", item.data.page, item.data.link)}}>
                  <Icon style={{height:18}}>chevron_right</Icon>
                </DroppableWrapper>}
              </td>
            </tr>
            {link.children && (<RecursiveLinks childrenLinks={link.children} nestedLevel={nestedLevel} />)}
          </>)
        })}
      </>
    )
  }


  return (
    <>
      {editLink && <PageLinkEdit link={editLink} page={null} updatedCallback={() => { ConfigHelper.clearCache("sdSlug=" + props.keyName); setEditLink(null); props.refresh();  }} onDone={() => { setEditLink(null); }} />}
      <table className="table">
        <tbody>
          <RecursiveLinks childrenLinks={structuredLinks} nestedLevel={-1} />
        </tbody>
      </table>
    </>
  );
}
