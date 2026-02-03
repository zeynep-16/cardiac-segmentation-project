from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import shutil
from pathlib import Path

# SADECE ED + ES segmentasyon fonksiyonu
from app.inference.segment import segment_mri_ed_es

app = FastAPI()

# ======================================================
# CORS AYARLARI
# ======================================================
# backend'e tarayıcı üzerinden istek atabilmek için
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ======================================================
# OUTPUTS KLASÖRÜ
# ======================================================
outputs_dir = Path("outputs")
outputs_dir.mkdir(exist_ok=True)
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

# ======================================================
# ED + ES MRI → SEGMENTASYON + EDV / ESV / EF
# ======================================================
@app.post("/segment_mri_ed_es")
async def segment_ed_es_mri(
    ed_file: UploadFile = File(...),
    es_file: UploadFile = File(...),
    slice_index: int | None = Form(None)
):
    # Geçici dosya klasörü
    temp_dir = Path("temp_files")
    temp_dir.mkdir(exist_ok=True)

    # Dosya yolları
    ed_path = temp_dir / f"ED_{ed_file.filename}"
    es_path = temp_dir / f"ES_{es_file.filename}"

    # ED dosyasını kaydet
    with open(ed_path, "wb") as buffer:
        shutil.copyfileobj(ed_file.file, buffer)

    # ES dosyasını kaydet
    with open(es_path, "wb") as buffer:
        shutil.copyfileobj(es_file.file, buffer)

    # Segmentasyon + EF hesabı
    result = segment_mri_ed_es(
        str(ed_path),
        str(es_path),
        slice_index
    )

    # Frontend'e JSON-safe response
    return {
        "status": "ok",
        "mode": "ed_es",

        "slice_index": int(result["slice_index"]),
        "voxel_volume_ml": float(result["voxel_volume_ml"]),
        "spacing_mm": [float(x) for x in result["spacing_mm"]],

        "ED": {
            "original": result["ED"]["original"],
            "mask": result["ED"]["mask"],
            "overlay": result["ED"]["overlay"],
        },
        "ES": {
            "original": result["ES"]["original"],
            "mask": result["ES"]["mask"],
            "overlay": result["ES"]["overlay"],
        },

        "EF_metrics": {
            "EDV_ml": float(result["EF_metrics"]["EDV_ml"]),
            "ESV_ml": float(result["EF_metrics"]["ESV_ml"]),
            "EF_percent": float(result["EF_metrics"]["EF_percent"]),
            "QC": result["EF_metrics"]["QC"]
        }
    }
