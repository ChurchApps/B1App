"use client";
import { styled } from "@mui/material/styles";
import { Box, Card as MuiCard } from "@mui/material";

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

export const HeaderSection = styled(Box)({
  backgroundColor: "#FFFFFF",
  padding: 24,
  textAlign: "center",
  borderRadius: 8,
  marginBottom: 16,
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
});

export const CheckinCard = styled(MuiCard)({
  borderRadius: 12,
  marginBottom: 12,
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  overflow: "hidden"
});

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

export const EmptyStateCard = styled(MuiCard)({
  borderRadius: 12,
  padding: 32,
  textAlign: "center",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
});

export const ServiceTimeItem = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: 16,
  backgroundColor: "#F6F6F8",
  borderBottom: "1px solid #F0F0F0"
});

// Variables cascade from mobile (--mb-*) to web (--app-*) to B1 defaults.
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
