import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  InputAdornment,
} from "@mui/material";

import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Lütfen tüm alanları doldurunuz.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      alert("Giriş hatası: " + err.message);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #E5E9EF 0%, #F2F4F7 40%, #FFFFFF 100%)", // GÜNCEL GRİ-MAVİ ARKA PLAN
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
            borderRadius: 5,
            backdropFilter: "blur(12px)",
            background: "rgba(255, 255, 255, 0.55)",
            border: "1px solid rgba(0,0,0,0.12)",
            boxShadow:
              "0 8px 28px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.10)",
            textAlign: "center",
          }}
        >
          <Typography
            variant="h4"
            fontWeight="800"
            sx={{
              color: "#1E3A8A", // Lacivert kurumsal mavi
              mb: 1,
            }}
          >
            Doktor Giriş
          </Typography>

          <Typography
            variant="body2"
            sx={{ color: "#4B5563", mb: 4, fontSize: "0.95rem" }}
          >
            Lütfen sisteme giriş yapmak için bilgilerinizi giriniz.
          </Typography>

          {/* Email */}
          <TextField
            placeholder="Email"
            fullWidth
            variant="outlined"
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                background: "#ffffff",
                borderRadius: 2,
              },
            }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon sx={{ color: "#2563EB" }} /> 
                </InputAdornment>
              ),
            }}
          />

          {/* Password */}
          <TextField
            placeholder="Şifre"
            type="password"
            fullWidth
            variant="outlined"
            sx={{
              mb: 4,
              "& .MuiOutlinedInput-root": {
                background: "#ffffff",
                borderRadius: 2,
              },
            }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: "#2563EB" }} />
                </InputAdornment>
              ),
            }}
          />

          {/* Login Button */}
          <Button
            variant="contained"
            fullWidth
            size="large"
            sx={{
              py: 1.4,
              fontSize: "1.1rem",
              borderRadius: 2,
              background: "linear-gradient(135deg, #3B82F6, #2563EB)", // MAVİ GRADIENT
              ":hover": {
                background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                transform: "translateY(-2px)",
              },
              transition: "0.2s",
            }}
            onClick={handleLogin}
          >
            Giriş Yap
          </Button>

          <Typography sx={{ mt: 3, color: "#374151" }}>
            Hesabın yok mu?{" "}
            <Link
              to="/register"
              style={{ color: "#2563EB", fontWeight: "600" }}
            >
              Kayıt Ol
            </Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}

export default Login;
