import { Grid } from "@mui/material";
import React from "react";

interface Props { selectedFunction: (emoji: string) => void }

export const Emojis: React.FC<Props> = (props) => {
  const getOptions = () => {
    const result = [];
    const emojis = [
      "\u{1F600}",
      "\u{1F601}",
      "\u{1F602}",
      "\u{1F603}",
      "\u{1F604}",
      "\u{1F605}",
      "\u{1F606}",
      "\u{1F609}",
      "\u{1F60A}",
      "\u{1F607}",
      "\u{1F60D}",
      "\u{1F618}",
      "\u{1F61C}",
      "\u{1F61D}",
      "\u{1F60E}",
      "\u{1F917}",
      "\u{1F914}",
      "\u{1F644}",
      "\u{1F612}",
      "\u{1F62C}",
      "\u{1F625}",
      "\u{1F622}",
      "\u{1F62D}",
      "\u{1F631}",
      "\u{1F621}",
      "\u{1F92F}",
      "\u{1F632}",
      "\u{1F634}",
      "\u{1F637}",
      "\u{1F92B}",
      "\u{1F44D}",
      "\u{1F44E}",
      "\u{1F44F}",
      "\u{1F64C}",
      "\u{1F64F}",
      "\u{1F4AA}",
      "\u{270B}",
      "\u{1F44B}",
      "\u{1F91E}",
      "\u{1F44A}",
      "\u{2764}\uFE0F",
      "\u{1F9E1}",
      "\u{1F49B}",
      "\u{1F49A}",
      "\u{1F499}",
      "\u{1F49C}",
      "\u{2B50}",
      "\u{1F525}",
      "\u{2705}",
      "\u{274C}",
      "\u{1F389}",
      "\u{1F388}",
      "\u{1F381}",
      "\u{1F3B5}",
      "\u{1F4E3}",
      "\u{1F4F7}",
      "\u{2615}",
      "\u{26EA}",
      "\u{1F4D6}",
      "\u{1F4A1}"
    ];
    for (let i = 0; i < emojis.length; i++) {
      result.push(<Grid key={i} size={{ xs: 6, md: 2 }}>
        <a href="about:blank" onClick={(e: React.MouseEvent) => { e.preventDefault(); props.selectedFunction(emojis[i]); }}>{emojis[i]}</a>
      </Grid>);
    }
    return result;
  };

  return (<div id="emojiContent">
    <Grid container spacing={3}>
      {getOptions()}
    </Grid>
  </div>);
};

