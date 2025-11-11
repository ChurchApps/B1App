import { Box, Card, Icon, Typography, Button } from "@mui/material";
import Link from "next/link";

export function CheckinComplete() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", paddingY: 6 }}>
      <Card sx={{ borderRadius: 3, padding: 4, textAlign: "center", maxWidth: 500, width: "100%" }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: "rgba(112, 220, 135, 0.1)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            margin: "0 auto 24px",
          }}
        >
          <Icon sx={{ fontSize: 48, color: "#70DC87" }}>check_circle</Icon>
        </Box>
        <Typography variant="h4" sx={{ color: "#3c3c3c", fontWeight: 700, marginBottom: 2 }}>
          Check-in Complete!
        </Typography>
        <Typography variant="body1" sx={{ color: "#9E9E9E", marginBottom: 3 }}>
          Your attendance has been saved. Thank you for checking in!
        </Typography>
        <Link href="/my/timeline" style={{ textDecoration: "none" }}>
          <Button
            variant="contained"
            fullWidth
            sx={{
              backgroundColor: "#0D47A1",
              borderRadius: 3,
              height: 48,
              fontWeight: 600,
              "&:hover": {
                backgroundColor: "#0B3D8F",
              },
            }}
          >
            Back to My Page
          </Button>
        </Link>
      </Card>
    </Box>
  );
}
