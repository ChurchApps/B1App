import Link from "next/link";
import { MarkdownPreviewLight } from "@churchapps/apphelper-markdown";
import type { GroupInterface } from "@churchapps/helpers";
import { useState } from "react";

interface Props {
  group: GroupInterface;
}

export default function GroupCard(props: Props) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={"/groups/details/" + props.group.slug} data-testid={`group-card-${props.group.slug}-link`}>
      {/* Card */}
      <div
        style={{
          borderRadius: "16px",
          overflow: "hidden",
          backgroundColor: "white",
          color: "black",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          border: isHovered ? "3px solid #124d7f" : "3px solid transparent",
          transition: "border 0.3s ease",
          display: "flex",
          flexDirection: "column",
          height: "100%"
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div style={{ position: "relative" }}>
          {/* Group Image */}
          <img
            src={props.group.photoUrl || "/images/group.jpg"}
            alt={props.group.name}
            style={{ width: "100%", height: "auto", display: "block", aspectRatio: 16 / 9 }}
          />
          {/* Black color gradient */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "60%",
              background:
                "linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent)"
            }}
          ></div>
          {/* Group Name */}
          <div
            style={{
              position: "absolute",
              bottom: "16px",
              left: "16px",
              color: "white",
              fontSize: "20px",
              fontWeight: "bold",
              lineHeight: "1.2",
              textTransform: "uppercase",
              width: "80%",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            {props.group.name}
          </div>
        </div>

        {/* Meeting Info */}
        <div style={{ padding: "16px", height: "35px", color: "#757575" }}>
          <div style={{ fontSize: 14, fontWeight: "bold" }}>
            <span style={{ float: "right" }}>
              {props.group.meetingLocation || "--"}
            </span>
            <span>{props.group.meetingTime || "--"}</span>
          </div>
        </div>
        {/* Description */}
        <div style={{ fontSize: "14px", color: "#757575", padding: "0 16px 16px 16px" }}>
          {!props.group.about || props.group.about === ""
            ? (
              <p style={{ fontStyle: "italic" }}>No Description Provided.</p>
            )
            : (
              <div style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", textOverflow: "ellipsis" }}>
                <MarkdownPreviewLight value={props.group.about} />
              </div>
            )}
        </div>
      </div>
    </Link>
  );
}
