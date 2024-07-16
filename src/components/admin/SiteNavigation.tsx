import React from "react";
import { LinkInterface } from "@churchapps/apphelper";
import { PageInterface } from "@/helpers";

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
    let idx = 0;
    return (
      <>
        {childrenLinks.map((link) => {
          idx++
          return (<>
            <tr><td><a href={"/admin/site/pages/preview" + link.url} style={{marginLeft: (nestedLevel * 20) + "px"}}>{link.text}</a></td></tr>
            {link.children && (<RecursiveLinks childrenLinks={link.children} nestedLevel={nestedLevel} />)}
          </>)
        })}
      </>
    )
  }


  return (
    <table className="table">
      <tbody>
        <RecursiveLinks childrenLinks={structuredLinks} nestedLevel={-1} />
      </tbody>
    </table>
  );
}
