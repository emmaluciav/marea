import React, { useState, useRef, useCallback, useEffect } from "react";

// Recortador/posicionador de foto estilo Instagram. La imagen nunca se
// deforma: se puede hacer zoom in/out, arrastrar para reposicionar y, si la
// foto tiene otra proporción, dejar áreas vacías (negras) en lugar de
// estirarla. Al guardar, el marco visible se exporta respetando las
// proporciones originales de la imagen.
export default function PhotoCropper({ file, aspect = 4 / 5, onSave, onCancel }) {
  const [src, setSrc] = useState(null);
  const [imgDim, setImgDim] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(null); // 0..1 normalizado
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [frame, setFrame] = useState({ w: 0, h: 0 });
  const [saving, setSaving] = useState(false);
  const frameRef = useRef(null);
  const imgRef = useRef(null);
  const drag = useRef({ active: false, sx: 0, sy: 0, bx: 0, by: 0 });

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImgDim({ w: img.naturalWidth, h: img.naturalHeight });
      setSrc(url);
      setZoom(null);
      setOffset({ x: 0, y: 0 });
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const update = () => {
      if (frameRef.current) {
        const r = frameRef.current.getBoundingClientRect();
        setFrame({ w: r.width, h: r.height });
      }
    };
    update();
    const id = requestAnimationFrame(update);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      cancelAnimationFrame(id);
    };
  }, []);

  const coverScale = frame.w && imgDim.w ? Math.max(frame.w / imgDim.w, frame.h / imgDim.h) : 1;
  const containScale = frame.w && imgDim.w ? Math.min(frame.w / imgDim.w, frame.h / imgDim.h) : 1;
  const minScale = containScale;
  const maxScale = Math.max(coverScale, containScale) * 4;
  const coverZoom = maxScale > minScale ? (coverScale - minScale) / (maxScale - minScale) : 0;
  const safeZoom = zoom == null ? coverZoom : zoom;
  const scale = minScale + (maxScale - minScale) * safeZoom;

  // Inicializa el zoom en "cover" una vez listos imagen y marco.
  useEffect(() => {
    if (zoom == null && imgDim.w && frame.w) setZoom(coverZoom);
  }, [zoom, imgDim, frame, coverZoom]);

  const dispW = imgDim.w * scale;
  const dispH = imgDim.h * scale;

  const clamp = useCallback(
    (x, y) => {
      if (!frame.w || !scale) return { x, y };
      const maxX = Math.abs(imgDim.w * scale - frame.w) / 2;
      const maxY = Math.abs(imgDim.h * scale - frame.h) / 2;
      return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
    },
    [frame, imgDim, scale]
  );

  const onPointerDown = (e) => {
    drag.current = { active: true, sx: e.clientX, sy: e.clientY, bx: offset.x, by: offset.y };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.sx;
    const dy = e.clientY - drag.current.sy;
    setOffset(clamp(drag.current.bx + dx, drag.current.by + dy));
  };
  const onPointerUp = () => {
    drag.current.active = false;
  };

  const handleZoom = (z) => {
    setZoom(z);
    setOffset((o) => clamp(o.x, o.y));
  };

  const handleSave = () => {
    if (!imgDim.w || !scale || !imgRef.current) return;
    setSaving(true);
    // El canvas representa el marco a la resolución natural de la imagen.
    const canvasW = Math.round(frame.w / scale);
    const canvasH = Math.round(frame.h / scale);
    const drawX = ((frame.w - dispW) / 2 + offset.x) / scale;
    const drawY = ((frame.h - dispH) / 2 + offset.y) / scale;
    const canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvasW, canvasH);
    // Dibuja la imagen a su tamaño natural (sin deformar) en su posición.
    ctx.drawImage(imgRef.current, drawX, drawY, imgDim.w, imgDim.h);
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setSaving(false);
          return;
        }
        const out = new File(
          [blob],
          (file.name || "foto").replace(/\.(png|jpe?g|webp|heic)$/i, ".jpg"),
          { type: "image/jpeg" }
        );
        try {
          await onSave(out);
        } finally {
          setSaving(false);
        }
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-obsidian">
      <div className="flex items-center justify-between px-4 py-3 text-parchment">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="text-sm text-parchment/80 disabled:opacity-50"
        >
          Cancelar
        </button>
        <span className="font-heading text-sm">Ajustar foto</span>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="text-sm font-medium text-gold disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center px-4">
        <div
          ref={frameRef}
          className="relative overflow-hidden bg-black"
          style={{ width: "100%", maxWidth: `calc(60vh * ${aspect})`, aspectRatio: String(aspect) }}
        >
          {src && (
            <img
              ref={imgRef}
              src={src}
              alt=""
              draggable={false}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="absolute touch-none select-none"
              style={{
                width: dispW,
                height: dispH,
                left: `calc(50% - ${dispW / 2}px + ${offset.x}px)`,
                top: `calc(50% - ${dispH / 2}px + ${offset.y}px)`,
              }}
            />
          )}
        </div>
      </div>

      <div className="px-6 pb-6 pt-2">
        <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wider text-parchment/60">
          <span>Zoom</span>
          <span>{coverScale ? (scale / coverScale).toFixed(1) : "1.0"}x</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={safeZoom}
          onChange={(e) => handleZoom(parseFloat(e.target.value))}
          disabled={saving}
          className="w-full accent-gold"
        />
        <p className="mt-3 text-center text-[11px] text-parchment/50">
          Arrastra para mover la foto dentro del marco
        </p>
      </div>
    </div>
  );
}