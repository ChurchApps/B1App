"use client";

import * as React from "react";
import { styled, Icon, InputBase, Typography, debounce, Grid, IconButton, Pagination, Stack } from "@mui/material";
import MuiPaper from "@mui/material/Paper";
import IconNamesList from "./IconNamesList"
import { Locale } from "@churchapps/apphelper";
import FlexSearch from "flexsearch";
const UPDATE_SEARCH_INDEX_WAIT_MS = 220;

const StyledIconSpan = styled("span")(({ theme }) => ({
  display: "inline-flex",
  flexDirection: "column",
  color: theme.palette.text.secondary,
  margin: "0 4px",
  "& > div": {
    display: "flex"
  },
  "& > div > *": {
    flexGrow: 1,
    fontSize: ".6rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    textAlign: "center",
    width: 0
  }
}));

const StyledIcon = styled(Icon)(({ theme }) => ({
  boxSizing: "content-box",
  cursor: "pointer",
  color: theme.palette.text.primary,
  borderRadius: theme.shape.borderRadius,
  transition: theme.transitions.create(["background-color", "box-shadow"], {
    duration: theme.transitions.duration.shortest
  }),
  padding: theme.spacing(1),
  margin: theme.spacing(0.5, 0),
  "&:hover": {
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[1]
  }
}));

const Icons = React.memo(function Icons(props: { icons: string[]; handleOpenClick: (name: string) => void; }) {
  const { icons, handleOpenClick } = props;

  const handleIconClick = (name: string) => {
    const camel = name.substring(0, 1).toLocaleLowerCase() + name.substring(1, name.length);
    const underscored = camel.replace(/[A-Z]/g, m => "_" + m.toLowerCase());
    handleOpenClick(underscored)
  }

  return (
    <div>
      {icons.map((icon) => (
        <StyledIconSpan key={icon}>
          <StyledIcon tabIndex={-1} sx={{ fontSize: "34px !important" }} onClick={() => { handleIconClick(icon) }} aria-label={`Select ${icon} icon`} data-testid={`icon-${icon}`}>
            {icon}
          </StyledIcon>
        </StyledIconSpan>
      ))}
    </div>
  );
});

const Paper = styled(MuiPaper)(({ theme }) => ({ padding: "2px 4px", display: "flex", alignItems: "center", marginBottom: theme.spacing(2), width: "100%" }));

const Input = styled(InputBase)({ marginLeft: 8, flex: 1 });

const searchIndex = new FlexSearch.Index({ tokenize: "full" });

interface IconData {
  iconName: string;
  componentName: string;
}

function createSearchIndex() {
  // create component names from icons list
  const iconsAndComponentNames: IconData[] = IconNamesList.map((icon: string) => {
    const split = icon.split("_");
    const capitalizedSplit = split.map((s: string) => {
      if (isAlphabet(s[0])) {
        s = s[0].toUpperCase() + s.slice(1)
      }
      return s
    })
    return {
      iconName: icon,
      componentName: capitalizedSplit.join("")
    };
  })

  // create search index
  iconsAndComponentNames.forEach((icon: IconData) => {
    let searchTerm = icon.iconName + " " + icon.componentName;

    searchIndex.addAsync(icon.iconName, searchTerm)
  })

}

function isAlphabet(character: string) {
  return /[a-zA-Z]/.test(character);
}

createSearchIndex();

type Props = {
  onSelect: (iconName: string) => void;
};

const defaultIcons = ["person", "group", "groups", "contact_mail", "mail", "church", "favorite", "volunteer_activism", "link", "home", "apps", "web", "public", "rss_feed", "videocam", "live_tv", "music_note", "menu_book", "star", "accessible", "woman", "man", "child_care", "handshake", "location_on", "restaurant", "local_cafe" ];

export function IconPicker(props: Props) {
  const pageSize = 27;
  const [keys, setKeys] = React.useState<string[] | null>(null);
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);

  const updateSearchResults = React.useMemo(
    () =>
      debounce((value: string) => {
        if (value === "") setKeys(defaultIcons);
        else searchIndex.searchAsync(value, { limit: 3000 }).then((results) => { setKeys(results.map(r => String(r))); setPage(1); });
      }, UPDATE_SEARCH_INDEX_WAIT_MS),
    []
  );

  React.useEffect(() => { updateSearchResults(query); return () => { updateSearchResults.clear(); }; }, [query, updateSearchResults]);

  function paged<T>(array: Array<T>, p: number) {
    return array.slice((p - 1) * pageSize, p * pageSize);
  }

  const icons = keys || IconNamesList;

  const pagesCount = Math.ceil(icons.length / pageSize);

  return (
    <Grid container sx={{ minHeight: 360, padding: "16px" }}>
      <Grid size={12}>
        <Paper>
          <IconButton sx={{ padding: "10px" }} aria-label="search" data-testid="icon-search-button">
            <Icon>search</Icon>
          </IconButton>
          <Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={Locale.label("iconPicker.searchIcons")} inputProps={{ "aria-label": "search icons" }} data-testid="icon-search-input" />
        </Paper>
        {(query === "") && <Typography sx={{ mb: 1 }}>{IconNamesList.length} {Locale.label("iconPicker.iconsAvailable")}</Typography>}
        {(query !== "") && <Typography sx={{ mb: 1 }}>{icons.length} {Locale.label("iconPicker.matchingResults")}</Typography>}

        <Icons icons={paged(icons, page)} handleOpenClick={props.onSelect} />
      </Grid>

      <Stack spacing={2} sx={{ margin: "0 auto" }}>
        <Pagination count={pagesCount} page={page} onChange={(_, p) => setPage(p)} size="small" />
      </Stack>
    </Grid>
  );
}
