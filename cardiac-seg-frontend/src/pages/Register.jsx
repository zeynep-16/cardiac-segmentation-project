import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  InputAdornment,
} from "@mui/material";

import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";

import { SnackbarContext } from "../contexts/SnackbarContext.jsx";

function Register() {
  const { showMessage } = useContext(SnackbarContext);
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      showMessage("Lütfen tüm alanları doldurunuz.", "error");
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", userCred.user.uid), {
        fullName,
        email,
      });
      console.log("KAYIT BAŞARILI MESAJI ÇAĞRILDI");
      showMessage("Kayıt başarılı! Sisteme giriş yapabilirsiniz.", "success");

      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (err) {
      console.error(err);
      showMessage("Kayıt hatası: " + err.message, "error");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #E0E0E0 0%, #F5F5F5 40%, #FAFAFA 100%)",
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
            textAlign: "center",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            border: "1px solid rgba(0,0,0,0.1)",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.15), 0 6px 16px rgba(0,0,0,0.1)",
          }}
        >
          <Typography variant="h4" fontWeight="800" sx={{ color: "#333", mb: 1 }}>
            Doktor Kayıt
          </Typography>

          <Typography sx={{ color: "#555", mb: 4 }}>
            Yeni bir hesap oluşturun ve sisteme giriş yapın.
          </Typography>

          <TextField
            placeholder="Ad Soyad"
            fullWidth
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": { background: "#fff", borderRadius: 2 },
            }}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon sx={{ color: "#FF6A13" }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            placeholder="Email"
            fullWidth
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": { background: "#fff", borderRadius: 2 },
            }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon sx={{ color: "#FF6A13" }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            placeholder="Şifre"
            type="password"
            fullWidth
            sx={{
              mb: 4,
              "& .MuiOutlinedInput-root": { background: "#fff", borderRadius: 2 },
            }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: "#FF6A13" }} />
                </InputAdornment>
              ),
            }}
          />

          <Button
            fullWidth
            variant="contained"
            size="large"
            sx={{
              py: 1.4,
              borderRadius: 2,
              fontSize: "1.1rem",
              background: "linear-gradient(135deg, #FF8A2B, #FF6A13)",
              ":hover": {
                background: "linear-gradient(135deg, #FF7A1F, #E45B0F)",
                transform: "translateY(-2px)",
              },
            }}
            onClick={handleRegister}
          >
            Kayıt Ol
          </Button>

          <Typography sx={{ mt: 3, color: "#444" }}>
            Zaten hesabın var mı?{" "}
            <Link to="/login" style={{ color: "#FF6A13", fontWeight: 600 }}>
              Giriş Yap
            </Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}

export default Register;
