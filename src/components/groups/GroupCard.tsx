import Link from "next/link";
import { Box, Typography } from "@mui/material";
import { Locale } from "@churchapps/apphelper";
import { MarkdownPreviewLight } from "@churchapps/apphelper/markdown";
import type { GroupInterface } from "@churchapps/helpers";

interface Props {
  group: GroupInterface;
}

export default function GroupCard(props: Props) {
  const { group } = props;
  const hasDescription = !!(group.about && group.about !== "");

  return (
    <Link href={"/groups/details/" + group.slug} data-testid={`group-card-${group.slug}-link`}>
      <Box
        sx={{
          borderRadius: "var(--app-radius-xl, 16px)",
          overflow: "hidden",
          bgcolor: "background.paper",
          color: "text.primary",
          // Dramatic shadow is deliberate for this card; admins can dial it
          // back globally via palette.shadow.lg if they want a flatter look.
          boxShadow: "var(--app-shadow-lg, 0 4px 20px rgba(0,0,0,0.2))",
          border: "3px solid transparent",
          transition: "border-color 0.3s ease",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          "&:hover": { borderColor: "var(--app-primary)" }
        }}
      >
        <Box sx={{ position: "relative" }}>
          <Box
            component="img"
            src={group.photoUrl || "/images/group.jpg"}
            alt={group.name}
            sx={{ width: "100%", height: "auto", display: "block", aspectRatio: "16 / 9" }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "60%",
              background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)"
            }}
          />
          <Typography
            sx={{
              position: "absolute",
              bottom: "16px",
              left: "16px",
              color: "#FFFFFF",
              fontSize: "20px",
              fontWeight: "bold",
              lineHeight: 1.2,
              textTransform: "uppercase",
              width: "80%",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            {group.name}
          </Typography>
        </Box>

        <Box sx={{ p: "16px", height: "35px", color: "text.secondary" }}>
          <Box sx={{ fontSize: 14, fontWeight: "bold" }}>
            <Box component="span" sx={{ float: "right" }}>
              {group.meetingLocation || "--"}
            </Box>
            <Box component="span">{group.meetingTime || "--"}</Box>
          </Box>
        </Box>

        <Box sx={{ fontSize: "14px", color: "text.secondary", px: "16px", pb: "16px" }}>
          {hasDescription ? (
            <Box
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              <MarkdownPreviewLight value={group.about} />
            </Box>
          ) : (
            <Typography component="p" sx={{ fontStyle: "italic", m: 0 }}>
              {Locale.label("groups.noDescription")}
            </Typography>
          )}
        </Box>
      </Box>
    </Link>
  );
}
