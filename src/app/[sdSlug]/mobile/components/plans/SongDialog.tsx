import { Box, Button, Typography } from "@mui/material";
import React, { useEffect } from "react";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import type { LinkInterface } from "@churchapps/helpers";
import { ArrangementInterface, ArrangementKeyInterface, SongDetailInterface } from "@/helpers";
import { SongDetails } from "./SongDetails";
import { isAudioUrl } from "./ContentRenderer";
import { ChordProHelper } from "@/helpers/ChordProHelper";
import { PraiseChartsHelper } from "@/helpers/PraiseChartsHelper";
import { mobileTheme } from "../mobileTheme";
import { Eyebrow, FilterPills, Sheet, TextLink } from "../kit";

const tc = mobileTheme.colors;

interface PraiseChartsProduct {
  name: string;
  file_type: string;
  download: string;
}

interface Props {
  arrangementKeyId?: string
  onClose: () => void,
}

export const SongDialog: React.FC<Props> = (props) => {
  const [arrangementKey, setArrangementKey] = React.useState<ArrangementKeyInterface | null>(null);
  const [arrangement, setArrangement] = React.useState<ArrangementInterface | null>(null);
  const [songDetail, setSongDetail] = React.useState<SongDetailInterface | null>(null);
  const [products, setProducts] = React.useState<PraiseChartsProduct[]>([]);
  const [links, setLinks] = React.useState<LinkInterface[]>([]);
  const [audioFiles, setAudioFiles] = React.useState<any[]>([]);
  const [keyOffset, setKeyOffset] = React.useState(0);

  const loadData = async () => {
    try {
      const ak = await ApiHelper.get("/arrangementKeys/" + props.arrangementKeyId, "ContentApi");
      setArrangementKey(ak);
      const arr = await ApiHelper.get("/arrangements/" + ak.arrangementId, "ContentApi");
      setArrangement(arr);
      ApiHelper.get("/files/arrangement/" + arr.id, "ContentApi").then((files: any[]) => setAudioFiles(files || [])).catch(() => setAudioFiles([]));
      if (arr.songDetailId) setSongDetail(await ApiHelper.get("/songDetails/" + arr.songDetailId, "ContentApi"));
    } catch (e) {
      console.error("Failed to load song:", e);
    }
  };

  useEffect(() => {
    if (props.arrangementKeyId) loadData();
  }, [props.arrangementKeyId]);


  const download = async (product: PraiseChartsProduct) => {
    const qs = product.download.split("?")[1].split("&");
    const skus = qs[0].split("=")[1];
    const keys = qs[1].split("=")[1];
    const url = await PraiseChartsHelper.download(skus, product.name + "." + product.file_type, keys);
    window.open(url, "_blank");
  };

  const listProducts = () => products.map((p, i) => (
    <TextLink key={i} data-testid={`song-download-${i}-link`} onClick={() => download(p)} sx={{ whiteSpace: "normal" }}>{p.name}</TextLink>
  ));

  const listLinks = () => links.map((l, i) => (
    <Box key={l.id}>
      <TextLink href={l.url} data-testid={`song-external-${i}-link`} sx={{ whiteSpace: "normal" }}>{l.text}</TextLink>
      {l.url && isAudioUrl(l.url) && (
        <audio controls preload="metadata" style={{ width: "100%", display: "block", marginTop: 4 }} src={l.url} data-testid={`song-external-${i}-audio`} />
      )}
    </Box>
  ));

  const listAudioFiles = () => audioFiles.map((f, i) => (
    <Box key={f.id}>
      <Typography sx={{ fontSize: 14 }}>{f.fileName}</Typography>
      <audio controls preload="metadata" style={{ width: "100%", display: "block", marginTop: 4 }} src={f.contentPath} data-testid={`song-audio-${i}-audio`}>
        {Locale.label("mobile.plans.audioUnsupported")}
      </audio>
    </Box>
  ));

  const loadPraiseCharts = async () => {
    if (arrangementKey && songDetail?.praiseChartsId) {
      const data = await ApiHelper.get("/praiseCharts/arrangement/raw/" + songDetail.praiseChartsId + "?keys=" + arrangementKey.keySignature, "ContentApi");
      const products = data[arrangementKey.keySignature || ""];
      if (products) setProducts(products);
      else setProducts([]);
    }
  };

  const loadLinks = () => {
    if (arrangementKey) ApiHelper.get("/links?category=arrangementKey_" + arrangementKey.id, "ContentApi").then((data: LinkInterface[]) => { setLinks(data || []); }).catch(() => setLinks([]));
  };

  useEffect(() => {
    loadLinks();
  }, [arrangementKey]);
  useEffect(() => {
    loadPraiseCharts().catch(() => setProducts([]));
  }, [arrangementKey, songDetail]);

  const getKeySelect = () => {
    const originalKey = songDetail?.keySignature;
    if (!originalKey) return null;
    const originalIndex = ChordProHelper.noteMap[originalKey];
    if (originalIndex === undefined) return null;
    return (
      <Box sx={{ mb: "12px" }}>
        <FilterPills
          label={Locale.label("mobile.plans.keySignature")}
          value={keyOffset}
          onChange={setKeyOffset}
          options={ChordProHelper.noteNames.map((note: string, index: number) => ({ value: index - originalIndex, label: note }))}
        />
      </Box>
    );
  };

  const hasFiles = products?.length > 0 || links.length > 0 || audioFiles.length > 0;

  return (
    <Sheet
      open={true}
      onClose={props.onClose}
      title={songDetail?.title || "Song Details"}
      maxWidth="md"
      actions={<Button variant="outlined" onClick={props.onClose} data-testid="song-dialog-close-button">{Locale.label("mobile.plans.close")}</Button>}
    >
      {songDetail?.artist && <Typography sx={{ color: tc.textSecondary, fontSize: 14, mt: "-6px", mb: "12px" }}>{songDetail.artist}</Typography>}
      {arrangement?.lyrics && <>
        <Box sx={{ mb: "8px" }}><Eyebrow component="h3">{Locale.label("mobile.plans.keySignature")}</Eyebrow></Box>
        {getKeySelect()}
        <Box sx={{ mb: "8px" }}><Eyebrow component="h3">{Locale.label("mobile.plans.lyrics")}</Eyebrow></Box>
        <div className="chordPro" dangerouslySetInnerHTML={{ __html: ChordProHelper.formatLyrics(arrangement?.lyrics, keyOffset) }}></div>
      </>}
      {hasFiles && (
        <Box sx={{ mt: "18px" }}>
          <Box sx={{ mb: "8px" }}><Eyebrow component="h3">{Locale.label("mobile.plans.files")}</Eyebrow></Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start" }}>
            {listProducts()}
            {listLinks()}
          </Box>
          {audioFiles.length > 0 && <>
            <Box sx={{ mt: "14px", mb: "8px" }}><Eyebrow component="h3">{Locale.label("mobile.plans.audioTracks")}</Eyebrow></Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>{listAudioFiles()}</Box>
          </>}
        </Box>
      )}
      {songDetail && <Box sx={{ mt: "18px" }}><SongDetails songDetail={songDetail} reload={() => { }} /></Box>}
    </Sheet>
  );
};
