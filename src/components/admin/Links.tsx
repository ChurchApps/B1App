import React from "react";
import { Icon } from "@mui/material";
import { LinkEdit } from "./LinkEdit";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import { UserHelper } from "@churchapps/apphelper/dist/helpers/UserHelper";
import { Loading } from "@churchapps/apphelper/dist/components/Loading";
import { SmallButton } from "@churchapps/apphelper/dist/components/SmallButton";
import { DisplayBox } from "@churchapps/apphelper/dist/components/DisplayBox";
import type { LinkInterface } from "@churchapps/apphelper/dist/helpers/Interfaces";

interface RecursiveInterface {
  childrenLinks: LinkInterface[];
  nestedLevel?: number;
}

interface Props {
  refresh?: any;
  category?: string;
}

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

export const Links: React.FC<Props> = (props) => {
  const [links, setLinks] = React.useState<LinkInterface[]>([]);
  const [currentLink, setCurrentLink] = React.useState<LinkInterface>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  let cat = props.category ? props.category : "website";

  const handleUpdated = () => { setCurrentLink(null); loadData(); }
  const getEditContent = () => <SmallButton icon="add" text="Add" onClick={handleAdd} data-testid="add-link-button" />
  const loadData = () => { ApiHelper.get("/links?category=" + cat, "ContentApi").then(data => { setLinks(data); setIsLoading(false); }); }
  const saveChanges = () => { ApiHelper.post("/links", links, "ContentApi").then(loadData); }

  const handleAdd = () => {
    let link: LinkInterface = { churchId: UserHelper.currentUserChurch.church.id, sort: links.length, text: "Home", url: "/", linkType: "url", linkData: "", category: cat, icon: "" }
    setCurrentLink(link);
  }

  const structuredLinks = links && getNestedChildren(links, undefined);

  const makeSortSequential = (structuredLinks: LinkInterface[]) => {
    for (let i = 0; i < structuredLinks.length; i++) structuredLinks[i].sort = i + 1;
  }

  const moveUp = (e: React.MouseEvent, structuredLinks: LinkInterface[]) => {
    e.preventDefault();
    const idx = parseInt(e.currentTarget.getAttribute("data-idx"));
    makeSortSequential(structuredLinks);
    structuredLinks[idx - 1].sort++;
    structuredLinks[idx].sort--;
    saveChanges();
  }

  const moveDown = (e: React.MouseEvent, structuredLinks: LinkInterface[]) => {
    e.preventDefault();
    const idx = parseInt(e.currentTarget.getAttribute("data-idx"));
    makeSortSequential(structuredLinks);
    structuredLinks[idx].sort++;
    structuredLinks[idx + 1].sort--;
    saveChanges();
  }

  const RecursiveLinks = ({childrenLinks, nestedLevel}: RecursiveInterface) => {
    //nestedLevel shows the level of recursion based on which styling is done.
    nestedLevel = nestedLevel + 1;
    let idx = 0;
    return (
      <>
        {childrenLinks.map((link) => {
          const upLink = (idx === 0) ? null : <a href="about:blank" data-idx={idx} onClick={(e: React.MouseEvent) => moveUp(e, childrenLinks)}><Icon>arrow_upward</Icon></a>
          const downLink = (idx === childrenLinks.length - 1) ? null : <a href="about:blank" data-idx={idx} onClick={(e: React.MouseEvent) => moveDown(e, childrenLinks)}><Icon>arrow_downward</Icon></a>
          idx++
          return (
            <>
              {link.children
                ? (
                  <>
                    <tr>
                      <td>
                        <a href={link.url} style={{marginLeft: (nestedLevel * 20) + "px"}}>{link.text}</a>
                      </td>
                      <td style={{textAlign: "right"}}>
                        {upLink}
                        {downLink}
                        <a href="about:blank" onClick={(e: React.MouseEvent) => { e.preventDefault(); setCurrentLink(link); }}><Icon>edit</Icon></a>
                      </td>
                    </tr>
                    <>
                      <RecursiveLinks childrenLinks={link.children} nestedLevel={nestedLevel} />
                    </>
                  </>
                )
                : (
                  <tr>
                    <td>
                      <a href={link.url} style={{marginLeft: (nestedLevel * 20) + "px"}}>{link.text}</a>
                    </td>
                    <td style={{textAlign: "right"}}>
                      {upLink}
                      {downLink}
                      <a href="about:blank" onClick={(e: React.MouseEvent) => { e.preventDefault(); setCurrentLink(link); }}><Icon>edit</Icon></a>
                    </td>
                  </tr>
                )}
            </>
          )
        })}
      </>
    )
  }

  const getLinks = (structuredLinks: LinkInterface[]) => {
    let idx = 0;
    let rows: JSX.Element[] = [];
    structuredLinks.forEach(link => {
      const upLink = (idx === 0) ? null : <a href="about:blank" data-idx={idx} onClick={(e: React.MouseEvent) => moveUp(e, structuredLinks)}><Icon>arrow_upward</Icon></a>
      const downLink = (idx === structuredLinks.length - 1) ? null : <a href="about:blank" data-idx={idx} onClick={(e: React.MouseEvent) => moveDown(e, structuredLinks)}><Icon>arrow_downward</Icon></a>
      rows.push(
        <>
          <tr key={idx}>
            <td><a href={link.url}>{link.text}</a></td>
            <td style={{ textAlign: "right" }}>
              {upLink}
              {downLink}
              <a href="about:blank" onClick={(e: React.MouseEvent) => { e.preventDefault(); setCurrentLink(link); }}><Icon>edit</Icon></a>
            </td>
          </tr>
          {link.children && <RecursiveLinks childrenLinks={link.children} nestedLevel={0} />}
        </>
      );
      idx++;
    })
    return rows;
  }

  const getTable = (structuredLinks: LinkInterface[]) => {
    if (isLoading) return <Loading />
    else return (<table className="table">
      <tbody>
        {getLinks(structuredLinks)}
      </tbody>
    </table>)
  }
  React.useEffect(() => { loadData(); }, [props?.refresh]);

  if (currentLink !== null) return <LinkEdit links={links} currentLink={currentLink} updatedFunction={handleUpdated} />;
  else return (
    <DisplayBox headerIcon="link" headerText="Navigation Links" editContent={getEditContent()} data-testid="navigation-links-display-box">
      {structuredLinks && getTable(structuredLinks)}
    </DisplayBox>
  );
}
