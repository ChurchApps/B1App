"use client";

import { Box } from "@mui/material";
import { Login } from "@/components";
import { usePathname } from "next/navigation";

export function SignInPanel() {
  const pathname = usePathname();
  return (
    <Box marginTop={6} marginBottom={4}>
      <Login redirectAfterLogin={pathname} showLogo={false} loginContainerCssProps={{ sx: { boxShadow: "none" } }} />
    </Box>
  );
}
