import React from "react";
import { Table, TableBody, TableCell, TableRow } from "@mui/material";
import { SongDetailInterface } from "@/helpers";
import { SongDetailLinks } from "./SongDetailLinks";

interface Props {
  songDetail: SongDetailInterface;
  reload: () => void;
}

export const SongDetails = (props: Props) => {


  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.style.display = "none";
  }

  const getDetails = () => {
    const result: JSX.Element[] = [];
    if (!props.songDetail) return result;


    if (props.songDetail.artist) result.push(<TableRow><TableCell><strong>Artist</strong></TableCell><TableCell>{props.songDetail.artist}</TableCell></TableRow>);
    if (props.songDetail.releaseDate) {
      const d = new Date(props.songDetail.releaseDate);
      result.push(<TableRow key="releaseDate"><TableCell><strong>Release Date</strong></TableCell><TableCell>{d.toLocaleDateString()}</TableCell></TableRow>);
    }
    if (props.songDetail.album) result.push(<TableRow key="album"><TableCell><strong>Album</strong></TableCell><TableCell>{props.songDetail.album}</TableCell></TableRow>);
    if (props.songDetail.language) result.push(<TableRow key="language"><TableCell><strong>Language</strong></TableCell><TableCell>{props.songDetail.language}</TableCell></TableRow>);
    if (props.songDetail.bpm) result.push(<TableRow key="bpm"><TableCell><strong>BPM</strong></TableCell><TableCell>{props.songDetail.bpm}</TableCell></TableRow>);
    if (props.songDetail.keySignature) result.push(<TableRow key="keySignature"><TableCell><strong>Key Signature</strong></TableCell><TableCell>{props.songDetail.keySignature}</TableCell></TableRow>);
    if (props.songDetail.tones) result.push(<TableRow key="tones"><TableCell><strong>Keys</strong></TableCell><TableCell>{props.songDetail.tones}</TableCell></TableRow>);
    if (props.songDetail.meter) result.push(<TableRow key="meter"><TableCell><strong>Meter</strong></TableCell><TableCell>{props.songDetail.meter}</TableCell></TableRow>);
    if (props.songDetail.seconds) result.push(<TableRow key="seconds"><TableCell><strong>Length</strong></TableCell><TableCell>{formatSeconds(props.songDetail.seconds)}</TableCell></TableRow>);

    return result;
  }

  const formatSeconds = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins + ":" + (secs < 10 ? "0" : "") + secs;
  }

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
}

