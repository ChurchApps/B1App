import React from "react";
import { Box } from "@mui/material";
import { SongDetailInterface } from "@/helpers";
import { DateHelper, Locale } from "@churchapps/apphelper";
import { SongDetailLinks } from "./SongDetailLinks";
import { KeyValues } from "../kit";

interface Props {
  songDetail: SongDetailInterface;
  reload: () => void;
}

const formatSeconds = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins + ":" + (secs < 10 ? "0" : "") + secs;
};

export const SongDetails = (props: Props) => {
  const d = props.songDetail;
  if (!d) return null;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.style.display = "none";
  };

  return (<>
    {d.thumbnail && <Box component="img" src={d.thumbnail} alt={d.title} onError={handleImageError} sx={{ display: "block", maxWidth: 160, borderRadius: "6px", mb: "12px" }} />}
    <KeyValues items={[
      { label: Locale.label("mobile.plans.artist"), value: d.artist },
      { label: Locale.label("mobile.plans.releaseDate"), value: d.releaseDate ? DateHelper.toDate(d.releaseDate).toLocaleDateString(DateHelper.locale) : "" },
      { label: Locale.label("mobile.plans.album"), value: d.album },
      { label: Locale.label("mobile.plans.language"), value: d.language },
      { label: "BPM", value: d.bpm },
      { label: Locale.label("mobile.plans.keySignature"), value: d.keySignature },
      { label: Locale.label("mobile.plans.keys"), value: d.tones },
      { label: Locale.label("mobile.plans.meter"), value: d.meter },
      { label: Locale.label("mobile.plans.length"), value: d.seconds ? formatSeconds(d.seconds) : "" }
    ]} />
    <SongDetailLinks songDetail={d} />
  </>);
};
