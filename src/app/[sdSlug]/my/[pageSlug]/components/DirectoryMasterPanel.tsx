"use client";

import React from "react";
import { ApiHelper, PersonHelper } from "@churchapps/apphelper";
import type { GroupInterface, PersonInterface } from "@churchapps/helpers";
import { Icon, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent } from "@mui/material";

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function DirectoryMasterPanel({ selectedId, onSelect }: Props) {
  const [searchText, setSearchText] = React.useState("");
  const [searchGroupId, setSearchGroupId] = React.useState("");
  const [people, setPeople] = React.useState<PersonInterface[] | null>(null);
  const [searchCategory, setSearchCategory] = React.useState<"people" | "group">("people");
  const [groups, setGroups] = React.useState<GroupInterface[]>(null);

  const handleSearch = () => {
    const term = encodeURIComponent(searchText.trim());
    if (searchCategory === "people") {
      if (term) ApiHelper.get("/people/search?term=" + term, "MembershipApi").then((data: PersonInterface[]) => setPeople(data));
      else ApiHelper.get("/people/directory/all", "MembershipApi").then((data: PersonInterface[]) => setPeople(data));
    } else {
      if (searchGroupId) ApiHelper.get("/people/search/group?groupId=" + searchGroupId, "MembershipApi").then((data: PersonInterface[]) => setPeople(data));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); handleSearch(); }
  };

  React.useEffect(() => {
    ApiHelper.get("/people/directory/all", "MembershipApi").then((data: PersonInterface[]) => setPeople(data));
    ApiHelper.get("/groups", "MembershipApi").then((data: GroupInterface[]) => setGroups(data));
  }, []);

  const getSortedAndGrouped = () => {
    if (!people || people.length === 0) return [];

    const sorted = [...people].sort((a, b) => {
      const lastA = (a.name?.last || "").toLowerCase();
      const lastB = (b.name?.last || "").toLowerCase();
      if (lastA !== lastB) return lastA.localeCompare(lastB);
      const firstA = (a.name?.first || "").toLowerCase();
      const firstB = (b.name?.first || "").toLowerCase();
      return firstA.localeCompare(firstB);
    });

    const groups: { letter: string; members: PersonInterface[] }[] = [];
    let currentLetter = "";
    for (const p of sorted) {
      const letter = (p.name?.last || "?")[0].toUpperCase();
      if (letter !== currentLetter) {
        currentLetter = letter;
        groups.push({ letter, members: [] });
      }
      groups[groups.length - 1].members.push(p);
    }
    return groups;
  };

  const grouped = getSortedAndGrouped();

  return (
    <>
      <div className="masterHeader">
        <h2>
          <Icon sx={{ color: "#1565C0" }}>person</Icon>
          Directory
        </h2>
        <div className="masterSearch">
          {searchCategory === "people" ? (
            <input
              type="text"
              placeholder="Search members..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <FormControl size="small" fullWidth>
              <InputLabel>Group</InputLabel>
              <Select
                label="Group"
                value={searchGroupId}
                onChange={(e: SelectChangeEvent<string>) => { setSearchGroupId(e.target.value); }}
                sx={{ fontSize: "0.875rem" }}
              >
                {groups?.map((g) => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
              </Select>
            </FormControl>
          )}
          <button
            onClick={handleSearch}
            style={{
              padding: "8px 16px", border: "none", borderRadius: 6,
              background: "#1565C0", color: "#fff", fontWeight: 500,
              cursor: "pointer", fontFamily: "inherit", fontSize: "0.875rem"
            }}
          >
            Search
          </button>
        </div>
        <div className="filterToggle">
          <button className={"filterBtn" + (searchCategory === "people" ? " active" : "")} onClick={() => setSearchCategory("people")}>People</button>
          <button className={"filterBtn" + (searchCategory === "group" ? " active" : "")} onClick={() => setSearchCategory("group")}>Groups</button>
        </div>
      </div>
      <div className="masterList">
        {people === null && <div style={{ padding: 20, color: "#666" }}>Loading...</div>}
        {people !== null && people.length === 0 && <div style={{ padding: 20, color: "#666" }}>No results found.</div>}
        {grouped.map((group) => (
          <React.Fragment key={group.letter}>
            <div className="letterDivider">{group.letter}</div>
            {group.members.map((p) => (
              <div
                key={p.id}
                className={"memberItem" + (selectedId === p.id ? " selected" : "")}
                onClick={() => onSelect(p.id)}
              >
                <img className="memberAvatar" src={PersonHelper.getPhotoUrl(p)} alt="" />
                <div className="memberInfo">
                  <div className="memberName">{p.name?.display}</div>
                  {p.name?.last && <div className="memberSub">{p.name.last} household</div>}
                </div>
                <Icon className="memberChevron">chevron_right</Icon>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </>
  );
}
