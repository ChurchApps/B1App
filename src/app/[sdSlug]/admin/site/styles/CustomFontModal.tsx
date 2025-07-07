import { ArrayHelper } from "@churchapps/apphelper/dist/helpers/ArrayHelper";
import { DialogContent, FormControl, Grid, InputLabel, MenuItem, Pagination, Select, SelectChangeEvent, TextField } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import React from "react";

import WebFont from 'webfontloader';

interface Props {
  updateValue: (font: string) => void,
  onClose: () => void
}

export const CustomFontModal: React.FC<Props> = props => {
  const [fonts, setFonts] = React.useState<{ category: string, family: string }[]>([]);
  const [category, setCategory] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const fontList = ["Open Sans", "Montserrat", "Oswald", "Roboto", "Poppins", "Playfair Display", "Lato", "Raleway", "Inter"]


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const val = e.target.value;
    switch (e.target.name) {
      case "category": setCategory(val); break;
      case "search": setSearch(val); break;
    }
    setPage(1);
  }

  const loadData = () => {
    const key = atob("QUl6YVN5RDlxTkViWDdIQzhvYXZGaC0tR0JrdkxVVkRUSnM4dlZB");
    fetch("https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity&key=" + key)
      .then(response => response.json())
      .then((data: any) => {
        const result: { category: string, family: string }[] = [];
        data.items.forEach((item: any) => { result.push({ family: item.family, category: item.category }) })
        console.log("DATA LENGTH", result.length)
        setFonts(result);
      });
  }

  const loadFonts = (fontList: { category: string, family: string }[]) => {
    const fonts: string[] = [];
    fontList.forEach(f => fonts.push(f.family));
    if (fonts.length>0) WebFont.load({
      google: { families: fonts }
    });
  }

  const getFiltered = () => {
    let filtered: { category: string, family: string }[] = [...fonts];
    if (category) filtered = ArrayHelper.getAll(filtered, "category", category);
    if (search) filtered = ArrayHelper.getAllContaining(filtered, "family", search)
    return filtered;
  }

  const getPages = () => {
    const filtered = getFiltered();
    const pages = Math.ceil(filtered.length / 10);
    return <Pagination count={pages} page={page} onChange={(e, p) => console.log(setPage(p))} />
  }

  const getResults = () => {
    if (fonts) {

      const filtered = getFiltered();
      const start = (page-1) * 10;
      let num = 10;
      if (start+num>filtered.length) num = filtered.length - start;
      const pageResults = filtered.splice((page-1) * 10, num);
      loadFonts(pageResults);

      const rows: React.ReactElement[] = [];
      pageResults.forEach(f => {
        const family = f.family;
        rows.push(<tr>
          <td><a href="about:blank" onClick={(e) => { e.preventDefault(); props.updateValue(family); }}>{f.family}</a></td>
          <td style={{ fontFamily: f.family }}>The quick brown fox jumps over the lazy dog.</td>
        </tr>)
      })

      return <table className="table table-sm" style={{minHeight:400}}>
        <thead>
          <tr><th>Name</th><th>Sample</th></tr>
          {rows}
        </thead>
      </table>
    }
  }

  React.useEffect(loadData, []);

  return (
    <Dialog open={true} onClose={props.onClose} fullWidth scroll="body">
      <DialogTitle>Select a Font</DialogTitle>
      <DialogContent>

        <Grid container spacing={3}>
          <Grid size={{ md: 8, xs: 12 }}>
            <FormControl fullWidth>
              <InputLabel>Category Filter</InputLabel>
              <Select fullWidth label="Category Filter" name="category" value={category} onChange={handleChange}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="serif">Serif</MenuItem>
                <MenuItem value="sans-serif">Sans Serif</MenuItem>
                <MenuItem value="display">Display</MenuItem>
                <MenuItem value="handwriting">Handwriting</MenuItem>
                <MenuItem value="monospace">Monospace</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ md: 4, xs: 12 }}>
            <TextField fullWidth label="Search" name="search" value={search} onChange={handleChange} />
          </Grid>
        </Grid>
        {getResults()}
        {getPages()}
      </DialogContent>
    </Dialog>
  );

}
