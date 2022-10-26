import * as React from "react";
import { styled, Icon, InputBase, Typography, debounce, Grid, IconButton, FormControlLabel, RadioGroup, Radio, SvgIcon, Pagination, Stack } from "@mui/material";
import MuiPaper from "@mui/material/Paper";
import { Id, Index as FlexSearchIndex } from "flexsearch";
import synonyms from "./synonyms";
import * as mui from "@mui/icons-material";

const UPDATE_SEARCH_INDEX_WAIT_MS = 220;

const StyledIcon = styled("span")(({ theme }) => ({
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

const StyledSvgIcon: any = styled(SvgIcon)(({ theme }) => ({
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

const Icons = React.memo(function Icons(props: { icons: any[]; handleOpenClick: (name: string) => void; }) {
  const { icons, handleOpenClick } = props;

  const handleIconClick = (name: string) => {
    const camel = name.substring(0, 1).toLocaleLowerCase() + name.substring(1, name.length);
    const underscored = camel.replace(/[A-Z]/g, m => "_" + m.toLowerCase());
    handleOpenClick(underscored)
  }

  return (
    <div>
      {icons.map((icon) => (
        <StyledIcon key={icon.importName}>
          <StyledSvgIcon component={icon.Component} fontSize="large" tabIndex={-1} onClick={() => { handleIconClick(icon.importName) }} title={icon.importName} />
        </StyledIcon>
      ))}
    </div>
  );
});

const Form = styled("form")(({ theme }) => ({
  margin: theme.spacing(0, 0)
}));

const StyledRadioGroup = styled(RadioGroup)(({ theme }) => ({
  "@media (max-width: 599.98px)": {
    flexDirection: "row"
  }
}));

const Paper = styled(MuiPaper)(({ theme }) => ({ padding: "2px 4px", display: "flex", alignItems: "center", marginBottom: theme.spacing(2), width: "100%" }));

const Input = styled(InputBase)({ marginLeft: 8, flex: 1 });

const searchIndex = new FlexSearchIndex({ tokenize: "full" });

const allIconsMap: any = {};
const allIcons = Object.keys(mui)
  .sort()
  .map((importName) => {
    let theme;
    if (importName.indexOf("Outlined") !== -1) theme = "Outlined";
    else if (importName.indexOf("TwoTone") !== -1) theme = "Two tone";
    else if (importName.indexOf("Rounded") !== -1) theme = "Rounded";
    else if (importName.indexOf("Sharp") !== -1) theme = "Sharp";
    else theme = "Filled";

    const name = importName.replace(/(Outlined|TwoTone|Rounded|Sharp)$/, "");
    let searchable = name;
    if (synonyms[searchable]) searchable += ` ${synonyms[searchable]}`;
    searchIndex.addAsync(importName, searchable);

    const icon = { importName, name, theme, Component: (mui as any)[importName] };
    allIconsMap[importName] = icon;
    return icon;
  });

type Props = {
  onSelect: (iconName: string) => void;
};

export default function SearchIcons(props: Props) {
  const pageSize = 21;
  const [keys, setKeys] = React.useState<Id[] | null>(null);
  const [theme, setTheme] = React.useState("Filled");
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);

  const updateSearchResults = React.useMemo(
    () =>
      debounce((value) => {
        if (value === "") setKeys(null);
        else searchIndex.searchAsync(value, { limit: 3000 }).then((results: any) => { setKeys(results); setPage(1); });
      }, UPDATE_SEARCH_INDEX_WAIT_MS),
    []
  );

  React.useEffect(() => { updateSearchResults(query); return () => { updateSearchResults.clear(); }; }, [query, updateSearchResults]);

  function paged<T>(array: Array<T>, p: number) {
    return array.slice((p - 1) * pageSize, p * pageSize);
  }

  const icons = React.useMemo(
    () =>
      (keys === null ? allIcons : keys.map((key) => allIconsMap[key])).filter(
        (icon) => theme === icon.theme
      ),
    [theme, keys]
  );

  const pagesCount = Math.ceil(icons.length / pageSize);

  return (
    <Grid container sx={{ minHeight: 360, padding: "16px" }}>
      <Grid item xs={12} sm={3}>
        <Form>
          <StyledRadioGroup>
            {["Filled", "Outlined", "Rounded", "Two tone", "Sharp"].map(
              (currentTheme) => (<FormControlLabel key={currentTheme} label={currentTheme}
                control={<Radio checked={theme === currentTheme} onChange={() => setTheme(currentTheme)} value={currentTheme} />}
              />)
            )}
          </StyledRadioGroup>
        </Form>
      </Grid>
      <Grid item xs={12} sm={9}>
        <Paper>
          <IconButton sx={{ padding: "10px" }} aria-label="search">
            <Icon>search</Icon>
          </IconButton>
          <Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search icons…" inputProps={{ "aria-label": "search icons" }} />
        </Paper>
        <Typography sx={{ mb: 1 }}>{`${icons.length} matching results`}</Typography>
        <Icons icons={paged(icons, page)} handleOpenClick={props.onSelect} />
      </Grid>
      <Stack spacing={2} sx={{ margin: "0 auto" }}>
        <Pagination count={pagesCount} page={page} onChange={(_, p) => setPage(p)} size="small" />
      </Stack>
    </Grid>
  );
}
