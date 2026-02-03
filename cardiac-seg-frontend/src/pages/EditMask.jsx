import { useRef, useState, useEffect } from "react";

// Canvas çizimi için react-konva
import { Stage, Layer, Image as KonvaImage, Line } from "react-konva";

// Sayfalar arası veri taşımak için
import { useLocation } from "react-router-dom";

// UI ikonları
import BrushIcon from "@mui/icons-material/Brush";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import UndoIcon from "@mui/icons-material/Undo";
import DownloadIcon from "@mui/icons-material/Download";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";

export default function EditMask() {
  const location = useLocation();

  // Önceki sayfadan gönderilen overlay görüntüsü
  const overlaySrc = location.state?.overlaySrc;

  const stageRef = useRef(); // Canvas referansı
  const isDrawing = useRef(false);

  const [overlayImage, setOverlayImage] = useState(null); // Arka plan
  const [lines, setLines] = useState([]); // Çizilen çizgiler
  const [currentColor, setCurrentColor] = useState("red"); // Seçili renk
  const [strokeWidth, setStrokeWidth] = useState(5); // Fırça kalınlığı


  const [scale, setScale] = useState(1); // Zoom seviyesi
  const [pos, setPos] = useState({ x: 0, y: 0 }); // Pan pozisyonu

  // Görsel yükleme
  useEffect(() => {
    if (!overlaySrc) return;

    const img = new Image();
    img.src = overlaySrc;
    img.onload = () => setOverlayImage(img);
  }, [overlaySrc]);

  // -----------------------------
  // Zoom (Mouse Wheel)
  // -----------------------------
  const handleWheel = (e) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    const oldScale = scale;
    const scaleBy = 1.06;

    const pointer = stage.getPointerPosition();
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

    const mousePoint = {
      x: (pointer.x - pos.x) / oldScale,
      y: (pointer.y - pos.y) / oldScale,
    };

    setScale(newScale);
    setPos({
      x: pointer.x - mousePoint.x * newScale,
      y: pointer.y - mousePoint.y * newScale,
    });
  };

  // -----------------------------
  // Pan (Right Click + Drag)
  // -----------------------------
  const handleStageMouseMove = (e) => {
    const evt = e.evt;
    if (evt.buttons === 2) {
      setPos({
        x: pos.x + evt.movementX,
        y: pos.y + evt.movementY,
      });
    }
  };

  // -----------------------------
  // Zoom in/out buttons
  // -----------------------------
  const zoomIn = () => setScale(scale * 1.1);
  const zoomOut = () => setScale(scale / 1.1);

  // -----------------------------
  // Çizim için doğru koordinat
  // -----------------------------
  const getLocalPointerPos = () => {
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    const transform = stage.getAbsoluteTransform().copy().invert();
    return transform.point(pointer);
  };

  // -----------------------------
  // Çizime başla
  // -----------------------------
  const handleMouseDown = (e) => {
    if (e.evt.button === 2) return; // sağ tık çizmesin

    isDrawing.current = true;
    const p = getLocalPointerPos();

    setLines((prev) => [
      ...prev,
      {
        points: [p.x, p.y],
        color: currentColor,
        width: strokeWidth,
        strokeOpacity: currentColor === "eraser" ? 0 : 1,
      },
    ]);
  };

  // -----------------------------
  // Çizimi sürdür
  // -----------------------------
  const handleMouseMove = () => {
    if (!isDrawing.current) return;

    const p = getLocalPointerPos();
    setLines((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      last.points = last.points.concat([p.x, p.y]);
      return updated;
    });
  };

  // -----------------------------
  // Çizimi bitir
  // -----------------------------
  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  // -----------------------------
  // Geri al
  // -----------------------------
  const handleUndo = () => {
    setLines((prev) => prev.slice(0, -1));
  };

  // -----------------------------
  // PNG olarak kaydet
  // -----------------------------
  const handleSave = () => {
    const uri = stageRef.current.toDataURL();
    const a = document.createElement("a");
    a.href = uri;
    a.download = "edited_mask.png";
    a.click();
  };

  // -----------------------------
  // UI Buton Tasarımı
  // -----------------------------
  const toolStyle = (active) => ({
    width: 42,
    height: 42,
    borderRadius: "50%",
    border: active ? "3px solid #1976d2" : "2px solid #bbb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fff",
    cursor: "pointer",
    boxShadow: active ? "0 0 8px rgba(25,118,210,0.6)" : "none",
  });

  return (
    <>
      {/* SABİT ARKA PLAN */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          backgroundImage: `
      linear-gradient(
        rgba(255,255,255,0.85),
        rgba(255,255,255,0.85)
      ),
      url('https://static.wixstatic.com/media/523368_66f98e0bb4224a3b987f103c2d47a1f1~mv2.jpeg/v1/fill/w_1480,h_740,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/523368_66f98e0bb4224a3b987f103c2d47a1f1~mv2.jpeg')
    `,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}
      />


      {/* İÇERİK */}
      <div
        style={{
          minHeight: "100vh",
          textAlign: "center",
          paddingTop: 30,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* APP BAR */}
        <div
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #0A4DA3 0%, #0D5BC1 100%)",
            boxShadow: "0 6px 20px rgba(10,77,163,0.45)",
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              padding: "18px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 72,
              fontSize: "1.35rem",
              fontWeight: 800,
              color: "white",
            }}
          >
            Manuel Segmentasyon Düzenleme
          </div>
        </div>

        {/* TOOLBAR */}
        <div
          style={{
            display: "flex",
            gap: 15,
            justifyContent: "center",
            padding: 15,
            borderRadius: 12,
            background: "white",
            margin: "20px auto",
            width: "fit-content",
            boxShadow: "0 3px 12px rgba(0,0,0,0.25)",
          }}
        >
          <div style={toolStyle(currentColor === "red")} onClick={() => setCurrentColor("red")}>
            <BrushIcon sx={{ color: "red" }} />
          </div>
          <div style={toolStyle(currentColor === "green")} onClick={() => setCurrentColor("green")}>
            <BrushIcon sx={{ color: "green" }} />
          </div>
          <div style={toolStyle(currentColor === "blue")} onClick={() => setCurrentColor("blue")}>
            <BrushIcon sx={{ color: "blue" }} />
          </div>
          <div style={toolStyle(currentColor === "eraser")} onClick={() => setCurrentColor("eraser")}>
            <AutoFixHighIcon sx={{ color: "gray" }} />
          </div>

          <select value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))}>
            <option value={3}>İnce</option>
            <option value={5}>Orta</option>
            <option value={10}>Kalın</option>
          </select>

          <div style={toolStyle()} onClick={handleUndo}>
            <UndoIcon />
          </div>
          <div style={toolStyle()} onClick={zoomIn}>
            <ZoomInIcon />
          </div>
          <div style={toolStyle()} onClick={zoomOut}>
            <ZoomOutIcon />
          </div>
          <div style={toolStyle()} onClick={handleSave}>
            <DownloadIcon />
          </div>
        </div>

        {/* CANVAS */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Stage
            width={650}
            height={650}
            ref={stageRef}
            scaleX={scale}
            scaleY={scale}
            x={pos.x}
            y={pos.y}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={(e) => {
              handleMouseMove(e);
              handleStageMouseMove(e);
            }}
            onMouseUp={handleMouseUp}
            style={{ background: "#111", borderRadius: 12 }}
          >
            <Layer>{overlayImage && <KonvaImage image={overlayImage} />}</Layer>
            <Layer>
              {lines.map((line, idx) => (
                <Line
                  key={idx}
                  points={line.points}
                  stroke={line.color === "eraser" ? "white" : line.color}
                  strokeOpacity={line.strokeOpacity}
                  strokeWidth={line.width}
                  lineCap="round"
                  lineJoin="round"
                />
              ))}
            </Layer>
          </Stage>
        </div>
      </div>
    </>
  );

}
