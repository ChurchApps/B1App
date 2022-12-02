import { Icon } from "@mui/material";
import React from "react";
import { LinkEdit } from "./LinkEdit";
import { ApiHelper, UserHelper } from "../../appBase/helpers";
import { LinkInterface } from "../../appBase/interfaces";
import { Loading, SmallButton, DisplayBox } from "../../appBase/components";

export const Links: React.FC = () => {
  const [links, setLinks] = React.useState<LinkInterface[]>([]);
  const [currentLink, setCurrentLink] = React.useState<LinkInterface>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const handleUpdated = () => { setCurrentLink(null); loadData(); }
  const getEditContent = () => <SmallButton icon="add" text="Add" onClick={handleAdd} />
  const loadData = () => { ApiHelper.get("/links?category=website", "ContentApi").then(data => { setLinks(data); setIsLoading(false); }); }
  const saveChanges = () => { ApiHelper.post("/links", links, "ContentApi").then(loadData); }

  const handleAdd = () => {
    let link: LinkInterface = { churchId: UserHelper.currentUserChurch.church.id, sort: links.length, text: "Home", url: "/", linkType: "url", linkData: "", category: "website", icon: "" }
    setCurrentLink(link);
  }

  const makeSortSequential = () => {
    for (let i = 0; i < links.length; i++) links[i].sort = i + 1;
  }

  const moveUp = (e: React.MouseEvent) => {
    e.preventDefault();
    const idx = parseInt(e.currentTarget.getAttribute("data-idx"));
    makeSortSequential();
    links[idx - 1].sort++;
    links[idx].sort--;
    saveChanges();
  }

  const moveDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const idx = parseInt(e.currentTarget.getAttribute("data-idx"));
    makeSortSequential();
    links[idx].sort++;
    links[idx + 1].sort--;
    saveChanges();
  }

  const getLinks = () => {
    let idx = 0;
    let rows: JSX.Element[] = [];
    links.forEach(link => {
      const upLink = (idx === 0) ? null : <a href="about:blank" data-idx={idx} onClick={moveUp}><Icon>arrow_upward</Icon></a>
      const downLink = (idx === links.length - 1) ? null : <a href="about:blank" data-idx={idx} onClick={moveDown}><Icon>arrow_downward</Icon></a>
      rows.push(
        <tr key={idx}>
          <td><a href={link.url}>{link.text}</a></td>
          <td style={{ textAlign: "right" }}>
            {upLink}
            {downLink}
            <a href="about:blank" onClick={(e: React.MouseEvent) => { e.preventDefault(); setCurrentLink(link); }}><Icon>edit</Icon></a>
          </td>
        </tr>
      );
      idx++;
    })
    return rows;
  }

  const getTable = () => {
    if (isLoading) return <Loading />
    else return (<table className="table">
      <tbody>
        {getLinks()}
      </tbody>
    </table>)
  }
  React.useEffect(() => { loadData(); }, []);

  if (currentLink !== null) return <LinkEdit currentLink={currentLink} updatedFunction={handleUpdated} />;
  else return (
    <DisplayBox headerIcon="link" headerText="Navigation Links" editContent={getEditContent()}>
      {getTable()}
    </DisplayBox>
  );
}
