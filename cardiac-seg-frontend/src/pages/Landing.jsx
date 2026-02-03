// src/pages/Landing.jsx
import { Link } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  Container,
  Paper,
  Divider,
} from "@mui/material";

function Landing() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 20% 20%, #0A4DA3 0%, #052B5A 60%, #031A33 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={20}
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: 5,
            backdropFilter: "blur(12px)",
            background: "rgba(255, 255, 255, 0.15)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            boxShadow:
              "0 8px 30px rgba(0,0,0,0.25), 0 4px 15px rgba(0,0,0,0.15)",
          }}
        >
          <Typography
            variant="h4"
            fontWeight="800"
            sx={{
              color: "#ffffff",
              letterSpacing: "0.5px",
              mb: 2,
              textShadow: "0px 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            Cardiac MRI AI
            <br />
            Segmentasyon Sistemi
          </Typography>

          <Divider sx={{ my: 3, bgcolor: "rgba(255,255,255,0.3)" }} />

          <Typography
            variant="body1"
            sx={{
              mb: 4,
              color: "#e3e6ea",
              fontSize: "1.05rem",
            }}
          >
            Doktorlar için geliştirilmiş ileri derin öğrenme tabanlı
            kardiyak MRI segmentasyon platformu.
          </Typography>

          <Box sx={{ display: "flex", gap: 3, justifyContent: "center" }}>
            <Button
              component={Link}
              to="/login"
              variant="contained"
              size="large"
              sx={{
                px: 4,
                py: 1.4,
                background: "linear-gradient(135deg, #2D8EFF, #1766C7)",
                ":hover": {
                  background: "linear-gradient(135deg, #1C6FDC, #12509B)",
                  transform: "translateY(-2px)",
                },
                transition: "0.2s",
              }}
            >
              Giriş Yap
            </Button>

            <Button
              component={Link}
              to="/register"
              variant="contained"
              size="large"
              sx={{
                px: 4,
                py: 1.4,
                background: "linear-gradient(135deg, #2FA560, #1D7F42)",
                ":hover": {
                  background: "linear-gradient(135deg, #249851, #166F36)",
                  transform: "translateY(-2px)",
                },
                transition: "0.2s",
              }}
            >
              Kayıt Ol
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default Landing;
