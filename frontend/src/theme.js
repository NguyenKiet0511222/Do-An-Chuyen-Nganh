import { createTheme } from "@mui/material/styles";

export const muiTheme = createTheme({
  palette: {
    primary: { main: "#10b981", dark: "#059669", light: "#34d399", contrastText: "#ffffff" },
    secondary: { main: "#3b82f6", dark: "#2563eb", light: "#60a5fa", contrastText: "#ffffff" },
    warning: { main: "#f59e0b", contrastText: "#ffffff" },
    error: { main: "#ef4444" },
    background: { default: "#f3f4f6", paper: "#ffffff" },
    text: { primary: "#111827", secondary: "#4b5563" },
    divider: "rgba(0, 0, 0, 0.08)"
  },
  typography: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    button: { textTransform: "none", fontWeight: 600, letterSpacing: "-0.01em" },
    h5: { fontWeight: 800, letterSpacing: "-0.02em", color: "#111827" },
    h6: { fontWeight: 700, letterSpacing: "-0.01em", color: "#111827" },
    subtitle1: { fontWeight: 600, letterSpacing: "-0.01em" }
  },
  shape: { borderRadius: 16 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "10px",
          padding: "8px 20px",
          boxShadow: "none",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "0 6px 20px -4px rgba(16, 185, 129, 0.4)",
          }
        },
        outlined: {
          borderWidth: "1.5px",
          "&:hover": {
            borderWidth: "1.5px",
            backgroundColor: "rgba(16, 185, 129, 0.04)",
            boxShadow: "none",
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        elevation1: {
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
        },
        outlined: {
          borderColor: "rgba(0, 0, 0, 0.08)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255, 255, 255, 0.8) !important",
          backdropFilter: "blur(12px)",
          color: "#111827",
          boxShadow: "inset 0 -1px 0 0 rgba(0, 0, 0, 0.05)",
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: "1px solid rgba(0, 0, 0, 0.05)",
          backgroundColor: "#ffffff",
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "12px",
            backgroundColor: "#f9fafb",
            transition: "all 0.2s",
            "&:hover": {
              backgroundColor: "#ffffff",
            },
            "&.Mui-focused": {
              backgroundColor: "#ffffff",
              boxShadow: "0 0 0 4px rgba(16, 185, 129, 0.1)",
            }
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: "8px",
        }
      }
    }
  }
});
