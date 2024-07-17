import React from "react";
import { LinkInterface } from "@churchapps/apphelper";
import { PageInterface } from "@/helpers";
import { PageLinkEdit } from "./site/PageLinkEdit";

interface RecursiveInterface {
  childrenLinks: LinkInterface[];
  nestedLevel?: number;
}

interface Props {
  links: LinkInterface[];
  pages: PageInterface[];
  refresh: () => void;
  select: (link: LinkInterface, page:PageInterface) => void;
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
    const style = {marginLeft: (nestedLevel * 20) + "px"}
    let idx = 0;
    return (
      <>
        {childrenLinks.map((link) => {
          const page = props.pages.find(p => p.url === link.url);
          const anchor = (page)
            ? (<a href={"/admin/site/pages/preview/" + page.id + "?linkId=" + link.id} style={style}>{link.text}</a>)
            : (<a href="about:blank" onClick={(e) => { e.preventDefault(); setEditLink(link); console.log("set edit link to", link) }} style={style}>{link.text}</a>)
          idx++
          return (<>
            <tr><td>{anchor}</td></tr>
            {link.children && (<RecursiveLinks childrenLinks={link.children} nestedLevel={nestedLevel} />)}
          </>)
        })}
      </>
    )
  }


  return (
    <>
      {editLink && <PageLinkEdit link={editLink} page={null} updatedCallback={() => { console.log("update callback"); setEditLink(null);  }} onDone={() => { console.log("done callback"); setEditLink(null); }} />}
      <table className="table">
        <tbody>
          <RecursiveLinks childrenLinks={structuredLinks} nestedLevel={-1} />
        </tbody>
      </table>
    </>
  );
}
