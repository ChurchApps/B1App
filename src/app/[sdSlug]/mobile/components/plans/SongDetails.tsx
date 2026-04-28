import React from "react";
import { Table, TableBody, TableCell, TableRow } from "@mui/material";
import { SongDetailInterface } from "@/helpers";
import { DateHelper, Locale } from "@churchapps/apphelper";
import { SongDetailLinks } from "./SongDetailLinks";

interface Props {
  songDetail: SongDetailInterface;
  reload: () => void;
}

export const SongDetails = (props: Props) => {


  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.style.display = "none";
  };

  const getDetails = () => {
    const result: React.ReactElement[] = [];
    if (!props.songDetail) return result;


    if (props.songDetail.artist) result.push(<TableRow><TableCell><strong>{Locale.label("mobile.plans.artist")}</strong></TableCell><TableCell>{props.songDetail.artist}</TableCell></TableRow>);
    if (props.songDetail.releaseDate) {
      const d = DateHelper.toDate(props.songDetail.releaseDate);
      result.push(<TableRow key="releaseDate"><TableCell><strong>{Locale.label("mobile.plans.releaseDate")}</strong></TableCell><TableCell>{d.toLocaleDateString()}</TableCell></TableRow>);
    }
    if (props.songDetail.album) result.push(<TableRow key="album"><TableCell><strong>{Locale.label("mobile.plans.album")}</strong></TableCell><TableCell>{props.songDetail.album}</TableCell></TableRow>);
    if (props.songDetail.language) result.push(<TableRow key="language"><TableCell><strong>{Locale.label("mobile.plans.language")}</strong></TableCell><TableCell>{props.songDetail.language}</TableCell></TableRow>);
    if (props.songDetail.bpm) result.push(<TableRow key="bpm"><TableCell><strong>BPM</strong></TableCell><TableCell>{props.songDetail.bpm}</TableCell></TableRow>);
    if (props.songDetail.keySignature) result.push(<TableRow key="keySignature"><TableCell><strong>{Locale.label("mobile.plans.keySignature")}</strong></TableCell><TableCell>{props.songDetail.keySignature}</TableCell></TableRow>);
    if (props.songDetail.tones) result.push(<TableRow key="tones"><TableCell><strong>{Locale.label("mobile.plans.keys")}</strong></TableCell><TableCell>{props.songDetail.tones}</TableCell></TableRow>);
    if (props.songDetail.meter) result.push(<TableRow key="meter"><TableCell><strong>{Locale.label("mobile.plans.meter")}</strong></TableCell><TableCell>{props.songDetail.meter}</TableCell></TableRow>);
    if (props.songDetail.seconds) result.push(<TableRow key="seconds"><TableCell><strong>{Locale.label("mobile.plans.length")}</strong></TableCell><TableCell>{formatSeconds(props.songDetail.seconds)}</TableCell></TableRow>);

    return result;
  };

  const formatSeconds = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins + ":" + (secs < 10 ? "0" : "") + secs;
  };

  return (<>
    <h3>{props.songDetail?.title}</h3>
    <img src={props.songDetail?.thumbnail} alt={props.songDetail?.title} style={{ display: "block", marginLeft: "auto", marginRight: "auto" }} onError={handleImageError} />
    <Table size="small">
      <TableBody>
        {getDetails()}
      </TableBody>
    </Table>
    <SongDetailLinks songDetail={props.songDetail} />
  </>);
};

