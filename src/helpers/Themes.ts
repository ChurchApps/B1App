import { createTheme } from "@mui/material";

export class Themes {
  static BaseTheme = createTheme({
    palette: { secondary: { main: "#444444" } },
    components: {
      MuiTextField: {
        defaultProps: { margin: "normal" },
        styleOverrides: { root: { "& .MuiOutlinedInput-root": { backgroundColor: "rgba(255, 255, 255, 0.8)" } } }
      },
      MuiFormControl: { defaultProps: { margin: "normal" } },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            borderRadius: 6
          }
        }
      }
    },
    typography: { fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' },
    shape: { borderRadius: 6 }
  });

  static NavBarStyle = { "& .selected .MuiListItemButton-root": { backgroundColor: "#333333" } };

}
