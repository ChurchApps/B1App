"use client";
import { styled } from "@mui/material/styles";
import { Box, Card as MuiCard } from "@mui/material";

// Common icon container for headers
export const HeaderIconContainer = styled(Box)({
  width: 80,
  height: 80,
  borderRadius: "50%",
  backgroundColor: "#F6F6F8",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  margin: "0 auto 16px"
});

// Header section wrapper
export const HeaderSection = styled(Box)({
  backgroundColor: "#FFFFFF",
  padding: 24,
  textAlign: "center",
  borderRadius: 8,
  marginBottom: 16,
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
});

// Standard card for checkin items
export const CheckinCard = styled(MuiCard)({
  borderRadius: 12,
  marginBottom: 12,
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  overflow: "hidden"
});

// Small circular icon container (for list items)
export const IconCircle = styled(Box)(({ size = 56 }: { size?: number }) => ({
  width: size,
  height: size,
  borderRadius: "50%",
  backgroundColor: "#F6F6F8",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  flexShrink: 0
}));

// Small white icon container (for nested items)
export const SmallIconCircle = styled(Box)({
  width: 32,
  height: 32,
  borderRadius: "50%",
  backgroundColor: "#FFFFFF",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  marginRight: 12
});

// Success icon container (green background)
export const SuccessIconContainer = styled(Box)({
  width: 80,
  height: 80,
  borderRadius: "50%",
  backgroundColor: "rgba(112, 220, 135, 0.1)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  margin: "0 auto 24px"
});

// Empty state card
export const EmptyStateCard = styled(MuiCard)({
  borderRadius: 12,
  padding: 32,
  textAlign: "center",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
});

// Service time item container (for household member expanded view)
export const ServiceTimeItem = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: 16,
  backgroundColor: "#F6F6F8",
  borderBottom: "1px solid #F0F0F0"
});

// Colors. `primary` and `secondary` resolve to the church's theme via CSS variables —
// `--mb-*` is set inside the mobile shell, `--app-*` on public-website pages.
// The hex literal at the end is the original B1 default and only renders if neither
// theme has been applied (e.g. before config loads).
export const colors = {
  primary: "var(--mb-primary, var(--app-primary, #0D47A1))",
  primaryHover: "var(--mb-primary, var(--app-primary, #0B3D8F))",
  secondary: "var(--mb-secondary, var(--app-secondary, #568BDA))",
  success: "#70DC87",
  successHover: "#5FC876",
  textPrimary: "#3c3c3c",
  textSecondary: "#9E9E9E",
  backgroundLight: "#F6F6F8",
  border: "#F0F0F0",
  white: "#FFFFFF"
};
