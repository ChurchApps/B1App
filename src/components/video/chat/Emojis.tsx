import React from "react";

interface Props { selectedFunction: (emoji: string) => void }

export const Emojis: React.FC<Props> = (props) => {
  const emojis = [
    "\u{1F600}", "\u{1F601}", "\u{1F602}", "\u{1F603}", "\u{1F604}", "\u{1F605}", "\u{1F606}", "\u{1F609}", "\u{1F60A}", "\u{1F607}",
    "\u{1F60D}", "\u{1F618}", "\u{1F61C}", "\u{1F61D}", "\u{1F60E}", "\u{1F917}", "\u{1F914}", "\u{1F644}", "\u{1F612}", "\u{1F62C}",
    "\u{1F625}", "\u{1F622}", "\u{1F62D}", "\u{1F631}", "\u{1F621}", "\u{1F92F}", "\u{1F632}", "\u{1F634}", "\u{1F637}", "\u{1F92B}",
    "\u{1F44D}", "\u{1F44E}", "\u{1F44F}", "\u{1F64C}", "\u{1F64F}", "\u{1F4AA}", "\u{270B}", "\u{1F44B}", "\u{1F91E}", "\u{1F44A}",
    "\u{2764}\uFE0F", "\u{1F9E1}", "\u{1F49B}", "\u{1F49A}", "\u{1F499}", "\u{1F49C}", "\u{2B50}", "\u{1F525}", "\u{2705}", "\u{274C}",
    "\u{1F389}", "\u{1F388}", "\u{1F381}", "\u{1F3B5}", "\u{1F4E3}", "\u{1F4F7}", "\u{2615}", "\u{26EA}", "\u{1F4D6}", "\u{1F4A1}"
  ];

  console.log(emojis, '--emojis')
  return (
    <div
      id="emojiContent"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        padding: "10px",
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        maxHeight: "150px",
        overflowY: "auto",
        justifyContent: "center",
        marginBottom: "10px"
      }}
    >
      {emojis.map((emoji, index) => (
        <button
          key={index}
          onClick={() => props.selectedFunction(emoji)}
          style={{
            background: "none",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            padding: "6px",
            borderRadius: "8px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
            outline: "none"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.2)";
            e.currentTarget.style.backgroundColor = "#f1f5f9";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};


