import torch # Modeli yüklemek için
import numpy as np
import nibabel as nib
from pathlib import Path # Dosya yollarını yönetmek için
import torch.nn as nn
import cv2 # Görüntü yeniden boyutlandırma ve görselleştirme işlemleri için
import base64  # Görselleri JSON ile taşınabilir metin (base64) formata dönüştürmek için

# ============================================================
#  RESUNET2D MODELİ 
# ============================================================

# Arka arkaya iki adet 3×3 convolution uygular
class ResidualDoubleConv(nn.Module):
    def __init__(self, c_in, c_out):
        super().__init__()
        self.conv = nn.Sequential( # İçine yazdığın katmanları yukarıdan aşağıya otomatik uygular
            nn.Conv2d(c_in, c_out, 3, padding=1, bias=False), # Girişten, 3×3 filtreler ile c_out adet feature map elde edilir
            nn.BatchNorm2d(c_out), # Çıkıştaki değerleri dengeliyor. Aşırı büyük / küçük değerleri toparlıyor
            nn.ReLU(inplace=True), # Negatif değerleri 0 yapar. ReLU olmazsa model karmaşık şeyler öğrenemez
            nn.Conv2d(c_out, c_out, 3, padding=1, bias=False),
            nn.BatchNorm2d(c_out),
        ) # shortcut / skip connection oluşturur.
        # Eğer giriş ve çıkış kanal sayısı farklıysa:
        #  - 1x1 convolution kullanarak kanal sayısını c_in -> c_out yap
        # Eğer aynıysa:
        #  - Hiçbir şey yapma (Identity = aynen geçir)
        self.shortcut = nn.Conv2d(c_in, c_out, 1, bias=False) if c_in != c_out else nn.Identity()
        # Toplama işleminden SONRA kullanılacak ReLU aktivasyonu
        # Negatif değerleri 0 yapar, pozitifi bırakır
        self.relu = nn.ReLU(inplace=True)

    def forward(self, x):
        # forward: Bu bloğa bir veri (x) geldiğinde ne olacağını tanımlar
        # self.conv(x):
        #  - x'i iki kez 3x3 convolution + BatchNorm (ve arada ReLU) ile işler
        #  - Yeni özellikler (feature maps) üretir
        # self.shortcut(x):
        #  - x'i kısa yoldan geçirir
        #  - Gerekirse 1x1 conv ile kanal sayısını ayarlar
        return self.relu(self.conv(x) + self.shortcut(x))

# ResUNet2D adında bir model tanımlıyoruz
class ResUNet2D(nn.Module):
    # Model oluşturulurken otomatik çalışan kurucu fonksiyon
    # c_in  = giriş kanal sayısı (1: gri görüntü, örn. MRI)
    # c_out = çıkış kanal sayısı (4: segmentasyon sınıfı sayısı)
    # base  = modelin başlangıç kanal sayısı (64 → 128 → 256 ...)
    def __init__(self, c_in=1, c_out=4, base=64):
        super().__init__()
        
        # 1. encoder bloğu. Giriş görüntüsünü alır (c_in kanal). base (ör: 64) kanallı özellikler çıkarır
        self.d1 = ResidualDoubleConv(c_in, base);     self.p1 = nn.MaxPool2d(2)
        # 2. encoder bloğu. Kanal sayısını artırır: base -> base*2 (64 -> 128)
        self.d2 = ResidualDoubleConv(base, base*2);   self.p2 = nn.MaxPool2d(2)
        self.d3 = ResidualDoubleConv(base*2, base*4); self.p3 = nn.MaxPool2d(2) # 3. encoder bloğu. Kanal sayısını artırır: base*2 -> base*4 (128 -> 256)
        self.d4 = ResidualDoubleConv(base*4, base*8); self.p4 = nn.MaxPool2d(2)

        # --------------------
        # BOTTLENECK (EN ALT SEVİYE)
        # --------------------
        # Encoder’dan gelen en derin özellikleri alır
        # Kanal sayısını base*8 -> base*16 yapar
        # Modelin en karmaşık ve en soyut bilgiyi öğrendiği katmandır
        self.b  = ResidualDoubleConv(base*8, base*16)

        # --------------------
        # DECODER (UPSAMPLING) BLOKLARI
        # --------------------
        # upsampling ->Görüntüyü büyütür
        # 4. seviye upsampling
        # ConvTranspose2d:
        #  - Uzamsal boyutu 2 katına çıkarır (H/16 -> H/8)
        #  - Kanal sayısını base*16 -> base*8 düşürür
        self.u4 = nn.ConvTranspose2d(base*16, base*8, 2, 2) # 2×2 pencere, 2 pikselde bir kay
        # Skip connection ile gelen base*16 kanallı veriyi alır
        # Tekrar base*8 kanala indirerek özellikleri birleştirir
        self.c4 = ResidualDoubleConv(base*16, base*8)
        # 3. seviye upsampling
        # Boyutu tekrar 2 katına çıkarır (H/8 -> H/4)
        # Kanal sayısını base*8 -> base*4 yapar
        self.u3 = nn.ConvTranspose2d(base*8, base*4, 2, 2)
        # Skip connection (encoder’dan gelen) + upsample edilmiş veri. Kanal sayısı: base*8 Çıkış: base*4
        self.c3 = ResidualDoubleConv(base*8, base*4)
        # 2. seviye upsampling
        # Boyut: H/4 -> H/2
        # Kanal: base*4 -> base*2
        self.u2 = nn.ConvTranspose2d(base*4, base*2, 2, 2)
        # Skip connection sonrası birleşen kanallar (base*4)
        # Residual conv ile base*2’ye düşürülür
        self.c2 = ResidualDoubleConv(base*4, base*2)
        # 1. seviye upsampling (girişe en yakın seviye)
        # Boyut: H/2 -> H
        # Kanal: base*2 -> base
        self.u1 = nn.ConvTranspose2d(base*2, base, 2, 2)
        # Son skip connection ile gelen encoder özellikleriyle birleştirme
        # Kanal sayısı: base*2
        # Çıkış: base
        self.c1 = ResidualDoubleConv(base*2, base)

        # Modelin çıkış katmanı
        # 0=BG, 1=RV, 2=MYO, 3=LV (ACDC standardı)
        self.out = nn.Conv2d(base, c_out, 1) # base: giriş kanal sayısı,c_out: çıkış kanal sayısı, 1×1 convolution

    def forward(self, x):
        # forward: Modele bir görüntü (x) geldiğinde
        # verinin ağ içinde nasıl akacağını tanımlar
        
        # --------------------
        # ENCODER (DOWN) YOLU
        # --------------------

        # 1. encoder bloğu:
        # Giriş görüntüsünden ilk seviyede özellik çıkar. MaxPool ile uzamsal boyutu yarıya indir
        d1 = self.d1(x); x = self.p1(d1)
        # 2. encoder bloğu: Daha soyut özellikler çıkarılır
        d2 = self.d2(x); x = self.p2(d2)
        d3 = self.d3(x); x = self.p3(d3) # 3. encoder bloğu. Boyut tekrar yarıya iner
        d4 = self.d4(x); x = self.p4(d4) # 4. encoder bloğu (en derin seviye) + Bottleneck öncesi son havuzlama
        # --------------------
        # BOTTLENECK
        # --------------------

        # Modelin en alt noktası:
        # En soyut ve en yoğun özellikler öğrenilir
        x = self.b(x)
        # --------------------
        # DECODER (UP) YOLU
        # --------------------

        # 4. seviye upsampling:
        # Uzamsal boyut 2 katına çıkarılır
        # Encoder'dan gelen d4 ile birleştirilir (skip connection)
        # dim=1 → kanal boyutunda birleştirme (C ekseni)
        x = self.u4(x); x = self.c4(torch.cat([x, d4], dim=1))
        x = self.u3(x); x = self.c3(torch.cat([x, d3], dim=1)) # 3. seviye upsampling + d3 ile skip connection + residual conv
        x = self.u2(x); x = self.c2(torch.cat([x, d2], dim=1)) # 2. seviye upsampling + d2 ile birleştirme
        x = self.u1(x); x = self.c1(torch.cat([x, d1], dim=1)) # 1. seviye upsampling (girişe en yakın seviye) + d1 ile son skip connection
        
        # --------------------
        # ÇIKIŞ KATMANI
        # --------------------

        # 1x1 convolution ile
        # her piksel için sınıf skorları üretilir
        return self.out(x)


# ============================================================
# MODEL YÜKLEME
# ============================================================

MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / "best_resunet2d_backend.pt"
# Modeli bellekte (RAM) tutmak için cache değişkeni
# Başlangıçta boş
_model_cache = None

def load_model():
    # Global cache değişkenini fonksiyon içinde kullanabilmek için
    global _model_cache
    # Eğer model daha önce yüklenmişse
    # tekrar diskten okuma, direkt RAM'deki modeli döndür
    if _model_cache is not None:
        return _model_cache

    # Model mimarisini oluştur 
    model = ResUNet2D()
    # Model ağırlıklarını diskten yükle
    state = torch.load(MODEL_PATH, map_location="cpu")

    # Eğer yüklenen dosya bir checkpoint ise
    # (yani içinde "state_dict" anahtarı varsa)
    # sadece ağırlıkları al
    if isinstance(state, dict) and "state_dict" in state:
        state = state["state_dict"]

    # Eğer model DataParallel ile eğitildiyse
    # anahtar isimlerinin başında "module." olur
    # Bu kısım o "module." ifadelerini temizler
    cleaned = {k.replace("module.", ""): v for k, v in state.items()}
    # Temizlenmiş ağırlıkları modele yükle
    model.load_state_dict(cleaned, strict=True)
    # Modeli değerlendirme (inference) moduna al
    # BatchNorm ve Dropout doğru şekilde çalışır
    model.eval()
    # Yüklenen modeli cache'e koy
    # Böylece bir daha diskten yüklenmez
    _model_cache = model
    return model # Hazır modeli döndür


# ============================================================
# NORMALİZASYON
# ============================================================

def normalize_volume(v):
    # Girdiyi float32 tipine çevir
    # (sayısal işlemler ve derin öğrenme için standart)
    v = v.astype(np.float32)
    # Sıfırdan büyük değerleri seçen maske oluştur
    # (arka plan genelde 0 olduğu için dışlanır)
    mask = v > 0
    # Eğer görüntüde hiç sıfırdan büyük değer yoksa
    # (tamamen boş / siyah görüntü durumu)
    # aynı boyutta sıfır dolu bir çıktı döndür
    if not np.any(mask):
        return np.zeros_like(v)
    # Sıfırdan büyük piksellerin
    # %1 ve %99 yüzdelik dilim değerlerini hesapla
    # (uç değerleri bastırmak için)
    lo, hi = np.percentile(v[mask], (1, 99))
    # Görüntü değerlerini [lo, hi] aralığına sıkıştır
    # (aşırı küçük ve büyük değerleri kes)
    v = np.clip(v, lo, hi)
    # Min-max normalizasyonu uygula:
    # lo → 0
    # hi → 1
    # max(hi - lo, 1e-5) → sıfıra bölmeyi önler
    v = (v - lo) / max(hi - lo, 1e-5)
    return np.clip(v, 0, 1) # değerlerin kesin olarak [0, 1] aralığında kalmasını sağlar


# ============================================================
# VOXEL HACMİ
# ============================================================

def voxel_volume_ml(img):
    # Görüntünün header bilgisinden voxel boyutlarını al
    # dx, dy, dz → bir voxel’in x, y ve z eksenlerindeki fiziksel boyutlarıdır
    # Birim: milimetre (mm)
    dx, dy, dz = img.header.get_zooms()[:3]
    return float(dx * dy * dz) / 1000.0


# ============================================================
# 3D MASK TAHMİNİ
# ============================================================
# Bu fonksiyon çalışırken gradyan hesaplanmasını kapatır
# (eğitim değil, sadece tahmin / inference yapıyoruz)
@torch.no_grad()
def predict_mask_3d(model, vol):
    # vol: 3D görüntü (H x W x D)
    # H → yükseklik, W → genişlik, D → slice (dilim) sayısı
    H, W, D = vol.shape
    # Tahmin edilecek 3D maske için boş bir dizi oluştur
    # uint8 → sınıf etiketleri (0,1,2,3) için yeterlidir
    pred = np.zeros((H, W, D), dtype=np.uint8)
    # 3. boyut (slice ekseni) boyunca tek tek ilerle
    for z in range(D):
        # z'inci slice'ı al (2D görüntü)
        # Slice'ı modele uygun boyuta getir
        # Model 256x256 ile eğitildiği için resize edilir
        slice2d = cv2.resize(vol[:, :, z], (256, 256))
        # NumPy dizisini PyTorch tensorüne çevir
        # unsqueeze(0) → batch boyutu ekler
        # unsqueeze(0) → kanal boyutu ekler
        # Son şekil: (1, 1, 256, 256)
        inp = torch.from_numpy(slice2d).unsqueeze(0).unsqueeze(0).float()
        # Modelden ham çıktıyı (logits) al
        # Çıkış şekli: (1, sınıf_sayısı, 256, 256)
        logits = model(inp)
        # Kanal (sınıf) boyutunda en büyük değeri seç
        # Her piksel için en olası sınıfı verir
        mask256 = torch.argmax(logits, dim=1)[0].cpu().numpy()
        # Tahmin edilen 256x256 maskeyi
        # tekrar orijinal boyuta (W, H) getir
        # INTER_NEAREST → sınıf etiketleri bozulmasın diye
        pred[:, :, z] = cv2.resize(mask256, (W, H), interpolation=cv2.INTER_NEAREST)
    # Tüm slice'lar işlendiğinde
    # 3D segmentasyon maskesini döndür
    return pred


# ============================================================
# EF / EDV / ESV
# ============================================================
# Sol ventrikül (LV) etiketi
# ACDC standardına göre:
# 0 = BG, 1 = RV, 2 = MYO, 3 = LV
LV_LABEL = 3

def compute_edv_esv_ef(ed_mask, es_mask, voxel_ml):
    # ed_mask → End-Diastole (ED) anındaki 3D segmentasyon maskesi
    # es_mask → End-Systole (ES) anındaki 3D segmentasyon maskesi
    # voxel_ml → bir voxel'in hacmi (mL cinsinden)

    # EDV (End-Diastolic Volume):
    # ED anında LV olarak etiketlenmiş voxel sayısını bul
    # voxel sayısı × voxel hacmi → toplam hacim (mL)
    edv = float(np.sum(ed_mask == LV_LABEL) * voxel_ml)
    # ESV (End-Systolic Volume):
    # ES anında LV olarak etiketlenmiş voxel sayısını bul
    # voxel sayısı × voxel hacmi → toplam hacim (mL) 1e-8, sıfıra bölme hatasını önlemek için
    esv = float(np.sum(es_mask == LV_LABEL) * voxel_ml)
    ef = (edv - esv) / (edv + 1e-8) * 100.0
    # Basit kalite kontrol (QC):
    # Normalde EDV ≥ ESV olmalıdır
    # Eğer değilse, sonuç şüpheli kabul edilir
    qc = "OK" if edv >= esv else "EDV<ESV"
    # Hesaplanan klinik metrikleri sözlük (dict) olarak döndür
    return {"EDV_ml": edv, "ESV_ml": esv, "EF_percent": ef, "QC": qc}


# ============================================================
# GÖRSELLEŞTİRME
# ============================================================

def encode_png(img):
    # OpenCV kullanarak görüntüyü PNG formatına encode et
    # imencode çıktısı: (başarılı mı?, byte buffer)
    _, buf = cv2.imencode(".png", img)
    # PNG byte verisini base64 formatına çevir
    # Böylece JSON içinde frontend'e gönderilebilir
    return base64.b64encode(buf).decode()

def build_viz(vol, mask, slice_index):
    # vol  → 3D orijinal görüntü (H x W x D)
    # mask → 3D segmentasyon maskesi (H x W x D)
    # slice_index → görselleştirilecek dilim (z indeksi)

    # Seçilen slice'ı al ve modele/ekrana uygun boyuta getir
    slice2d = cv2.resize(vol[:, :, slice_index], (256, 256))
    # Aynı slice için segmentasyon maskesini al
    # INTER_NEAREST kullanılır çünkü sınıf etiketleri bozulmamalı
    mask2d  = cv2.resize(mask[:, :, slice_index], (256, 256), interpolation=cv2.INTER_NEAREST)
    # Her sınıf için RGB renk tanımı
    # 0 = Background (siyah)
    # 1 = RV (kırmızı)
    # 2 = MYO (yeşil)
    # 3 = LV (mavi)
    colors = {0:(0,0,0), 1:(255,0,0), 2:(0,255,0), 3:(0,0,255)}
    mask_rgb = np.zeros((256,256,3), dtype=np.uint8)
    # Her sınıf için ilgili piksellere rengi ata
    for c,col in colors.items():
        # Renkli maske için boş bir RGB görüntü oluştur
        mask_rgb[mask2d == c] = col
    # Orijinal gri görüntüyü [0,255] aralığına çek
    # ve RGB formata dönüştür (overlay için gerekli)
    orig_rgb = cv2.cvtColor((slice2d*255).astype(np.uint8), cv2.COLOR_GRAY2RGB)
    # Orijinal görüntü ile renkli maskeyi üst üste bindir
    # 0.7 → orijinal görüntü ağ
    overlay = cv2.addWeighted(orig_rgb, 0.7, mask_rgb, 0.3, 0)
    # 0.7 → orijinal görüntü ağırlığı
    # 0.3 → maske ağırlığı
    return {
        "original": encode_png(orig_rgb), # Sadece orijinal slice
        "mask": encode_png(mask_rgb), # Sadece renkli maske
        "overlay": encode_png(overlay), # Orijinal + maske üst üste
    }


# ============================================================
# SADECE ED + ES ANALİZİ İÇİN
# ============================================================

def segment_mri_ed_es(ed_path, es_path, slice_index=None):
    # Eğitilmiş modeli (cache'li şekilde) yükle
    model = load_model()
    # ED (End-Diastole) ve ES (End-Systole) NIfTI dosyalarını yükle
    ed_img = nib.load(ed_path)
    es_img = nib.load(es_path)
    # NIfTI içindeki ham voxel verisini al (numpy array)
    # normalize_volume → [0,1] aralığında normalize eder
    ed_vol = normalize_volume(ed_img.get_fdata())
    es_vol = normalize_volume(es_img.get_fdata())
    # Voxel hacmini hesapla (mL cinsinden)
    # ED görüntüsünün spacing bilgisi kullanılır
    voxel_ml = voxel_volume_ml(ed_img)
    # 3D ED hacmi için segmentasyon maskesi tahmin et
    ed_mask = predict_mask_3d(model, ed_vol)
    # 3D ES hacmi için segmentasyon maskesi tahmin et
    es_mask = predict_mask_3d(model, es_vol)
    # ED ve ES maskelerini kullanarak
    # EDV, ESV ve EF değerlerini hesapla
    ef_metrics = compute_edv_esv_ef(ed_mask, es_mask, voxel_ml)
    # Görselleştirme için slice sayısını al
    D = ed_vol.shape[2]
    # Eğer slice_index verilmemişse
    # orta slice'ı (D // 2) seç
    if slice_index is None:
        slice_index = D // 2
    # slice_index değerini güvenli aralığa zorla
    # (0 ile D-1 arasında)
    slice_index = int(max(0, min(D-1, slice_index)))
    # Frontend'e gönderilecek sonuçları paketle
    return {
        "slice_index": slice_index, # Kullanılan slice indeksi
        "ED": build_viz(ed_vol, ed_mask, slice_index), # ED için görselleştirme çıktıları (orijinal, maske, overlay)
        "ES": build_viz(es_vol, es_mask, slice_index), # ES için görselleştirme çıktıları
        # Hesaplanan klinik metrikler # EDV, ESV, EF ve QC
        "EF_metrics": ef_metrics,
        # Görüntünün voxel spacing bilgisi (mm)
        "spacing_mm": [float(s) for s in ed_img.header.get_zooms()[:3]],
        "voxel_volume_ml": voxel_ml # Tek bir voxel'in hacmi (mL)
    }
