"use client";

import React, { useContext } from "react";
import { Box, Skeleton } from "@mui/material";
import { ApiHelper, Locale, UserHelper } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import type { PersonInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { Highlight, PageHead, PersonAvatar, Plate, PlateSection, QuietEmpty, Row, RowList, SearchField } from "../kit";

interface Props {
  config: ConfigurationInterface;
}

export const MessageComposePage = ({ config: _config }: Props) => {
  const context = useContext(UserContext);
  const loggedIn = !!context?.user?.firstName;
  const [searchText, setSearchText] = React.useState("");
  const [results, setResults] = React.useState<PersonInterface[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [lastSearched, setLastSearched] = React.useState("");
  const latestTerm = React.useRef("");

  const { data: previous = null } = useQuery<PersonInterface[]>({
    queryKey: ["compose-previous", context?.user?.id],
    queryFn: async () => {
      const pms: any[] = await ApiHelper.get("/privateMessages", "MessagingApi");
      if (!Array.isArray(pms) || pms.length === 0) return [];
      const myPersonId = UserHelper.person?.id;
      const ids = Array.from(
        new Set(
          pms
            .map((pm) => (myPersonId && pm.fromPersonId === myPersonId ? pm.toPersonId : pm.fromPersonId))
            .filter(Boolean)
        )
      );
      if (ids.length === 0) return [];
      const people: PersonInterface[] = await ApiHelper.get(`/people/basic?ids=${ids.join(",")}`, "MembershipApi");
      return Array.isArray(people) ? people : [];
    },
    enabled: loggedIn
  });

  const runSearch = React.useCallback(async (term: string) => {
    if (term === latestTerm.current) return;
    latestTerm.current = term;
    if (!term) {
      setResults([]);
      setLastSearched("");
      setLoading(false);
      return;
    }
    setLoading(true);
    let found: PersonInterface[] = [];
    try {
      const data: PersonInterface[] = await ApiHelper.get(`/people/search/?term=${encodeURIComponent(term)}`, "MembershipApi");
      found = (Array.isArray(data) ? data : []).filter((p) => (p as { allowDirectMessages?: boolean }).allowDirectMessages !== false);
    } catch {
      found = [];
    }
    // A slower earlier request must not overwrite the results for what's typed now.
    if (latestTerm.current !== term) return;
    setResults(found);
    setLastSearched(term);
    setLoading(false);
  }, []);

  const term = searchText.trim();

  React.useEffect(() => {
    const t = setTimeout(() => { runSearch(term); }, 300);
    return () => clearTimeout(t);
  }, [term, runSearch]);

  const renderRow = (p: PersonInterface, highlight = "") => (
    <Row
      key={p.id}
      href={`/mobile/messages/${p.id}`}
      leading={<PersonAvatar person={p} />}
      title={<Highlight text={p.name?.display || Locale.label("mobile.components.unknown")} term={highlight} />}
    />
  );

  return (
    <Box>
      <PageHead title={Locale.label("mobile.screenTitles.newMessage")} lede={Locale.label("mobile.messages.composeLede")} />
      <Plate>
        <Box sx={{ px: { xs: "16px", md: "24px" }, pt: { xs: "16px", md: "22px" }, pb: "4px" }}>
          <SearchField
            value={searchText}
            onChange={setSearchText}
            onEnter={() => runSearch(term)}
            label={Locale.label("mobile.screens.searchForMessage")}
            placeholder={Locale.label("mobile.screens.enterName")}
          />
        </Box>
        {term && (
          <PlateSection title={Locale.label("mobile.messages.matches")} sx={{ pt: "10px" }}>
            {loading && <Skeleton variant="text" width="40%" height={24} />}
            {!loading && lastSearched === term && results.length === 0 && <QuietEmpty>{Locale.label("mobile.messages.noMatches")}</QuietEmpty>}
            {!loading && results.length > 0 && <RowList>{results.map((p) => renderRow(p, term))}</RowList>}
          </PlateSection>
        )}
        <PlateSection title={Locale.label("mobile.messages.recent")} sx={term ? undefined : { pt: "10px" }}>
          {previous === null && <Skeleton variant="text" width="40%" height={24} />}
          {previous !== null && previous.length === 0 && <QuietEmpty>{Locale.label("mobile.messages.composeEmpty")}</QuietEmpty>}
          {previous !== null && previous.length > 0 && <RowList>{previous.map((p) => renderRow(p))}</RowList>}
        </PlateSection>
      </Plate>
    </Box>
  );
};

export default MessageComposePage;
