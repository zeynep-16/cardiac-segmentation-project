// src/pages/Dashboard.jsx
import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Paper,
  Button,
  CircularProgress,
  Grid,
  TextField,
} from "@mui/material";

import { useNavigate } from "react-router-dom";
import { useSegmentation } from "../contexts/SegmentationContext";

function Dashboard() {
  const [edFile, setEdFile] = useState(null);
  const [esFile, setEsFile] = useState(null);
  const [sliceIndex, setSliceIndex] = useState("");
  const [loading, setLoading] = useState(false);

  const { result, setResult } = useSegmentation();

  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!edFile || !esFile) {
      alert("Lütfen ED ve ES MRI (.nii) dosyalarını seçin.");
      return;
    }

    const formData = new FormData();
    formData.append("ed_file", edFile);
    formData.append("es_file", esFile);

    if (sliceIndex !== "") {
      formData.append("slice_index", sliceIndex);
    }

    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/segment_mri_ed_es", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Backend hatası");

      const data = await res.json();
      console.log("Backend yanıtı:", data);
      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Hata oluştu! Backend çalışıyor mu?");
    }
    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage:
            "url('https://www.medtravel.ai/assets/storage/image/251944262Gemini_Generated_Image_r3lxt7r3lxt7r3lx.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.15,
          zIndex: 0,
        }}
      />

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
        }}
      >
        {/* HEADER */}
        <AppBar position="static" sx={{ bgcolor: "#0A4DA3" }}>
          <Toolbar sx={{ justifyContent: "space-between" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Cardiac MRI AI Segmentasyon Sistemi
            </Typography>

            <Box sx={{ display: "flex", gap: 4 }}>
              <Typography sx={{ cursor: "pointer" }}>Ana Sayfa</Typography>
              <Typography sx={{ cursor: "pointer" }}>Hakkında</Typography>
              <Typography sx={{ cursor: "pointer" }}>İletişim</Typography>
            </Box>
          </Toolbar>
        </AppBar>

        {/* BODY */}
        <Container maxWidth="lg" sx={{ mt: 6, mb: 10 }}>
          <Paper elevation={6} sx={{ p: 5, borderRadius: 4 }}>
            <Typography
              variant="h4"
              textAlign="center"
              fontWeight="bold"
              color="primary"
              mb={4}
            >
              ED / ES MRI Segmentasyonu
            </Typography>

            {/* Upload Alanı */}
            <Paper
              variant="outlined"
              sx={{
                p: 4,
                textAlign: "center",
                borderRadius: 4,
                mb: 5,
                backgroundColor: "#F7F9FC",
                boxShadow: "inset 0 0 0 1px rgba(10,77,163,0.15)",
              }}
            >
              <Grid container spacing={4} justifyContent="center">
                <Grid item xs={12} md={5}>
                  <Typography fontWeight="bold" mb={1}>
                    End-Diastole (ED)
                  </Typography>
                  <Button
                    component="label"
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2.5,
                      px: 4,
                      py: 1.3,
                      minWidth: 220,
                      color: "white",
                      background: edFile
                        ? "linear-gradient(135deg, #2E7D32 0%, #43A047 100%)"
                        : "linear-gradient(135deg, #0A4DA3 0%, #1976D2 100%)",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
                      "&:hover": {
                        background: edFile
                          ? "linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)"
                          : "linear-gradient(135deg, #083b7a 0%, #1565C0 100%)",
                        boxShadow: "0 12px 28px rgba(0,0,0,0.3)",
                      },
                    }}
                  >
                    {edFile ? "✓ ED Dosyası Seçildi" : "ED Dosyası Seç (.nii)"}
                    <input
                      type="file"
                      hidden
                      onChange={(e) => setEdFile(e.target.files[0])}
                    />
                  </Button>


                </Grid>

                <Grid item xs={12} md={5}>
                  <Typography fontWeight="bold" mb={1}>
                    End-Systole (ES)
                  </Typography>
                  <Button
                    component="label"
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2.5,
                      px: 4,
                      py: 1.3,
                      minWidth: 220,
                      color: "white",
                      background: esFile
                        ? "linear-gradient(135deg, #2E7D32 0%, #43A047 100%)"
                        : "linear-gradient(135deg, #0A4DA3 0%, #1976D2 100%)",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
                      "&:hover": {
                        background: esFile
                          ? "linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)"
                          : "linear-gradient(135deg, #083b7a 0%, #1565C0 100%)",
                        boxShadow: "0 12px 28px rgba(0,0,0,0.3)",
                      },
                    }}
                  >
                    {esFile ? "✓ ES Dosyası Seçildi" : "ES Dosyası Seç (.nii)"}
                    <input
                      type="file"
                      hidden
                      onChange={(e) => setEsFile(e.target.files[0])}
                    />
                  </Button>


                </Grid>
              </Grid>

              <Box mt={3}>
                <TextField
                  label="Slice Index (opsiyonel)"
                  type="number"
                  value={sliceIndex}
                  onChange={(e) => setSliceIndex(e.target.value)}
                  sx={{ width: 250, mb: 2 }}
                />

                <Button
                  variant="contained"
                  onClick={handleUpload}
                  size="large"
                  sx={{
                    mt: 1,
                    px: 6,
                    py: 1.6,
                    borderRadius: 3,
                    fontWeight: 700,
                    fontSize: "1rem",
                    letterSpacing: 0.5,
                    textTransform: "none",
                    background: "linear-gradient(135deg, #00796B 0%, #26A69A 100%)",
                    boxShadow: "0 10px 28px rgba(0,121,107,0.45)",
                    transition: "all 0.25s ease",
                    "&:hover": {
                      background: "linear-gradient(135deg, #00695C 0%, #009688 100%)",
                      boxShadow: "0 16px 36px rgba(0,121,107,0.55)",
                      transform: "translateY(-1px)",
                    },
                    "&:active": {
                      transform: "translateY(0px)",
                      boxShadow: "0 8px 18px rgba(0,121,107,0.4)",
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={26} sx={{ color: "white" }} />
                  ) : (
                    "Segmentasyonu Başlat"
                  )}
                </Button>


              </Box>
            </Paper>

            {/* SONUÇLAR */}
            {result && (
              <Box>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  color="primary"
                  mb={2}
                >
                  Sonuçlar
                </Typography>

                <Typography mb={3}>
                  Seçilen slice indeksi: <b>{result.slice_index}</b>
                </Typography>

                {/* ===== ED ===== */}
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  End-Diastole (ED)
                </Typography>

                <Grid container spacing={4}>
                  <Grid item xs={12} md={4}>
                    <Typography fontWeight="bold">Ham MRI</Typography>
                    <img
                      src={`data:image/png;base64,${result.ED.original}`}
                      style={{ width: "100%", borderRadius: 12 }}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Typography fontWeight="bold">Segmentasyon</Typography>
                    <img
                      src={`data:image/png;base64,${result.ED.mask}`}
                      style={{ width: "100%", borderRadius: 12 }}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Typography fontWeight="bold">Overlay</Typography>
                    <img
                      src={`data:image/png;base64,${result.ED.overlay}`}
                      style={{ width: "100%", borderRadius: 12 }}
                    />
                    <Button
                      variant="contained"
                      color="secondary"
                      sx={{ mt: 2 }}
                      onClick={() =>
                        navigate("/edit", {
                          state: {
                            overlaySrc: `data:image/png;base64,${result.ED.overlay}`,
                            phase: "ED",
                            slice_index: result.slice_index,
                          },
                        })
                      }
                    >
                      ED Düzenle
                    </Button>
                  </Grid>
                </Grid>

                {/* ===== ES ===== */}
                <Typography variant="h6" fontWeight="bold" mt={5} mb={2}>
                  End-Systole (ES)
                </Typography>

                <Grid container spacing={4}>
                  <Grid item xs={12} md={4}>
                    <Typography fontWeight="bold">Ham MRI</Typography>
                    <img
                      src={`data:image/png;base64,${result.ES.original}`}
                      style={{ width: "100%", borderRadius: 12 }}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Typography fontWeight="bold">Segmentasyon</Typography>
                    <img
                      src={`data:image/png;base64,${result.ES.mask}`}
                      style={{ width: "100%", borderRadius: 12 }}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Typography fontWeight="bold">Overlay</Typography>
                    <img
                      src={`data:image/png;base64,${result.ES.overlay}`}
                      style={{ width: "100%", borderRadius: 12 }}
                    />
                    <Button
                      variant="contained"
                      color="secondary"
                      sx={{ mt: 2 }}
                      onClick={() =>
                        navigate("/edit", {
                          state: {
                            overlaySrc: `data:image/png;base64,${result.ES.overlay}`,
                            phase: "ES",
                            slice_index: result.slice_index,
                          },
                        })
                      }
                    >
                      ES Düzenle
                    </Button>
                  </Grid>
                </Grid>

                {/* EF SONUÇLARI */}
                <Paper sx={{
                  mt: 5,
                  p: 3,
                  borderRadius: 3,
                  background: "linear-gradient(180deg, #FFFFFF 0%, #F7FAFF 100%)",
                  boxShadow: "0 8px 24px rgba(10,77,163,0.12)",
                  borderLeft: "6px solid #0A4DA3",
                }}>
                  <Typography variant="h6" fontWeight="bold" mb={2}>
                    Fonksiyonel Ölçümler
                  </Typography>

                  <Typography>
                    <b>EDV:</b> {result.EF_metrics.EDV_ml.toFixed(2)} ml
                  </Typography>

                  <Typography>
                    <b>ESV:</b> {result.EF_metrics.ESV_ml.toFixed(2)} ml
                  </Typography>

                  <Typography
                    sx={{
                      mt: 2,
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 1.5,
                      background: "rgba(0,121,107,0.08)",
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                    }}
                  >
                    <b>Ejection Fraction (EF):</b>
                    <span style={{ color: "#00796B", fontSize: "1.2rem" }}>
                      %{result.EF_metrics.EF_percent.toFixed(2)}
                    </span>
                  </Typography>



                  {result.EF_metrics.QC !== "OK" && (
                    <Typography color="error" mt={1}>
                      Uyarı: ED/ES sıralaması hatalı olabilir.
                    </Typography>
                  )}
                </Paper>

                {/* TEKNİK BİLGİLENDİRME KUTUSU */}
                <Paper sx={{
                  mt: 3,
                  p: 3,
                  borderRadius: 3,
                  background: "linear-gradient(180deg, #F9FBFF 0%, #EEF3FA 100%)",
                  boxShadow: "0 6px 18px rgba(10,77,163,0.08)",
                  borderTop: "4px solid #0A4DA3",
                }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    mb={2}
                    sx={{
                      color: "#0A4DA3",
                      letterSpacing: 0.4,
                      textTransform: "uppercase",
                      fontSize: "0.85rem",
                      pl: 1.5,
                      borderLeft: "4px solid #0A4DA3",
                    }}
                  >
                    Sol Ventrikül Fonksiyonel Parametreleri
                  </Typography>




                  <Typography variant="body2"
                    sx={{
                      color: "#37474F",           // koyu gri 
                      backgroundColor: "rgba(10,77,163,0.04)",
                      p: 1.4,
                      borderRadius: 2,
                      mb: 1.2,
                      lineHeight: 1.7,
                      fontWeight: 400,
                    }}>
                    <b>EDV (End-Diastolic Volume)</b>, kalp gevşeme evresinin
                    sonunda sol karıncıkta bulunan en yüksek kan hacmini ifade
                    eder.
                  </Typography>

                  <Typography variant="body2"
                    sx={{
                      color: "#37474F",           // koyu gri 
                      backgroundColor: "rgba(10,77,163,0.04)",
                      p: 1.4,
                      borderRadius: 2,
                      mb: 1.2,
                      lineHeight: 1.7,
                      fontWeight: 400,
                    }}>
                    <b>ESV (End-Systolic Volume)</b>, kalbin kasılması
                    tamamlandıktan sonra sol ventrikülde kalan kan miktarını
                    ifade eder.
                  </Typography>

                  <Typography variant="body2"
                    sx={{
                      color: "#37474F",           // koyu gri 
                      backgroundColor: "rgba(10,77,163,0.04)",
                      p: 1.4,
                      borderRadius: 2,
                      mb: 1.2,
                      lineHeight: 1.7,
                      fontWeight: 400,
                    }}>
                    <b>Ejection Fraction (EF)</b>, sol karıncığın pompalama
                    etkinliğini gösteren temel işlevsel ölçüdür ve dışarı atılan
                    kan miktarının, dolum sırasında biriken toplam kan miktarına
                    oranı olarak tanımlanır.
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      color: "#37474F",           // koyu gri 
                      backgroundColor: "rgba(10,77,163,0.04)",
                      p: 1.4,
                      borderRadius: 2,
                      mb: 1.2,
                      lineHeight: 1.7,
                      fontWeight: 400,
                    }}
                  >
                    EF,
                    <Box
                      component="span"
                      sx={{
                        display: "inline-block",
                        ml: 1,
                        px: 1.5,
                        py: 0.5,
                        backgroundColor: "#E3F2FD",
                        borderRadius: 1.5,
                        fontFamily: "monospace",
                        fontWeight: 600,
                        color: "#0A4DA3",
                      }}
                    >
                      (EDV − ESV) / EDV × 100
                    </Box>{" "}
                    formülü ile hesaplanır ve sol ventrikül fonksiyonlarının nicel
                    değerlendirilmesinde klinik pratikte yaygın olarak kullanılmaktadır.
                  </Typography>

                </Paper>
              </Box>
            )}
          </Paper>
        </Container>

        {/* FOOTER */}
        <Box
          sx={{
            mt: "auto",
            py: 3,
            textAlign: "center",
            bgcolor: "#0A3D7A",
            color: "white",
          }}
        >
          © 2025 Cardiac MRI AI Platform — Tüm Hakları Saklıdır.
        </Box>
      </Box>
    </Box>
  );
}

export default Dashboard;
