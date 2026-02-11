import { Grid } from "@mui/material";
import React from "react";

interface Props { selectedFunction: (emoji: string) => void }

export const Emojis: React.FC<Props> = (props) => {
  const getOptions = () => {
    const result = [];
    const emojis = [
      "😀", "😁", "🤣", "😉", "😊", "😇", "😍", "😜", "🤫", "🤨", "🙄", "😬", "😔", "😷", "🤯", "😎", "😲", "❤", "👋", "✋", "🤞", "👍", "👊", "👏", "🙌", "🙏"
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

