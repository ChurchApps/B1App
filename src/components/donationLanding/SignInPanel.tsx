import { Box } from "@mui/material"
import { Login } from "@/components"

export function SignInPanel() {
  return (
    <Box marginTop={6} marginBottom={4}>
      <Login showLogo={false} loginContainerCssProps={{ sx: { boxShadow: "none" } }} />
    </Box>
  );
}
