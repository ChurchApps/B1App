import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid } from "@mui/material";
import React, { useEffect } from "react";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import type { LinkInterface } from "@churchapps/apphelper/dist/helpers/Interfaces";
import { ArrangementInterface, ArrangementKeyInterface, SongDetailInterface, SongInterface } from "@/helpers";
import { SongDetails } from "./SongDetails";
import { ChordProHelper } from "@/helpers/ChordProHelper";
import { PraiseChartsHelper } from "@/helpers/PraiseChartsHelper";


interface Props {
  arrangementKeyId?: string
  onClose: () => void,
}

export const SongDialog: React.FC<Props> = (props) => {
  const [arrangementKey, setArrangementKey] = React.useState<ArrangementKeyInterface>(null);
  const [arrangement, setArrangement] = React.useState<ArrangementInterface>(null);
  const [song, setSong] = React.useState<SongInterface>(null);
  const [songDetail, setSongDetail] = React.useState<SongDetailInterface>(null);
  const [products, setProducts] = React.useState<any[]>([]);
  const [links, setLinks] = React.useState<LinkInterface[]>([]);

  const loadData = async () => {
    const ak = await ApiHelper.get("/arrangementKeys/" + props.arrangementKeyId, "ContentApi");
    setArrangementKey(ak);
    const arr = await ApiHelper.get("/arrangements/" + ak.arrangementId, "ContentApi");
    setArrangement(arr);
    const s = await ApiHelper.get("/songs/" + arr.songId, "ContentApi");
    setSong(s);
    const sd = await ApiHelper.get("/songDetails/" + arr.songDetailId, "ContentApi");
    setSongDetail(sd);
  }

  useEffect(() => {
    if (props.arrangementKeyId) loadData();
  }, [props.arrangementKeyId]); //eslint-disable-line react-hooks/exhaustive-deps


  const download = async (product: any) => {
    const qs = product.download.split("?")[1].split("&");
    const skus = qs[0].split("=")[1];
    const keys = qs[1].split("=")[1];
    const url = await PraiseChartsHelper.download(skus, product.name + "." + product.file_type, keys)
    window.open(url, "_blank");
  }

  const listProducts = () => (<ul>
    {products.map((p, i) => (<li key={i}>
      <a href="about:blank" onClick={(e) => { e.preventDefault(); download(p); }}>
        {p.name}
      </a>
    </li>))}
  </ul>)

  const listLinks = () => (<ul>
    {links.map((l, i) => (<li key={l.id}>
      <a href={l.url} target="_blank" rel="noreferrer">{l.text}</a>
    </li>))}
  </ul>)

  const loadPraiseCharts = async () => {
    if (arrangementKey && songDetail?.praiseChartsId) {
      const data = await ApiHelper.get("/praiseCharts/arrangement/raw/" + songDetail.praiseChartsId + "?keys=" + arrangementKey.keySignature, "ContentApi");
      const products = data[arrangementKey.keySignature];
      if (products) setProducts(products);
      else setProducts([]);
    }
  }

  const loadLinks = () => {
    if (arrangementKey) ApiHelper.get("/links?category=arrangementKey_" + arrangementKey.id, "ContentApi").then(data => { setLinks(data); });
  }

  useEffect(() => { loadData() }, [props.arrangementKeyId]) //eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (songDetail && arrangementKey) {
      loadPraiseCharts();
      loadLinks();
    }
  }, [arrangementKey, songDetail]) //eslint-disable-line react-hooks/exhaustive-deps


  return (<>
    <Dialog open={true} onClose={props.onClose} fullWidth maxWidth="xl">
      <DialogTitle>{songDetail?.title || "Song Details"}</DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={9}>
            {(products?.length > 0 || links.length > 0) && <>
              <h3>Files</h3>
              {listProducts()}
              {listLinks()}
            </>}


            {arrangement?.lyrics && <>
              <h3>Lyrics</h3>
              <div className="chordPro" dangerouslySetInnerHTML={{ __html: ChordProHelper.formatLyrics(arrangement?.lyrics, 0) }}></div>
            </>}


          </Grid>
          <Grid item xs={12} md={3}>
            <SongDetails songDetail={songDetail} reload={() => { }} />
          </Grid>
        </Grid>

      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={props.onClose} data-testid="song-dialog-close-button">Close</Button>
      </DialogActions>
    </Dialog>
  </>);
};
