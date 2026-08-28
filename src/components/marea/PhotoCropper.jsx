import React, { useState, useRef, useCallback, useEffect } from "react";

// Posicionador de foto estilo Instagram: marco fijo + zoom (slider/pinch) +
// arrastre/pan. La imagen NUNCA se deforma: el zoom escala la imagen original
// de forma uniforme (mismo factor en X e Y), por lo que sus proporciones se
// mantienen siempre. Si la foto no coincide con la proporción del marco, el
// espacio sobrante se rellena en negro (letterbox) en lugar de estirar la imagen.
// Al guardar, el marco visible se exporta a la resolución natural de la imagen.
export default function PhotoCropper({ file, aspect = 4 / 5, onSave, onCancel }) {
  const [src, setSrc] = useState(null);
  const [imgDim, setImgDim] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1); // 1 = cubrir el marco; >1 acerca; <1 aleja
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
      setZoom(1);
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

  // Escala base "cover": la imagen cubre todo el marco (recortando lo que sobre).
  const coverScale = frame.w && imgDim.w ? Math.max(frame.w / imgDim.w, frame.h / imgDim.h) : 1;
  // Escala uniforme final: MISMO factor en X e Y => sin deformación.
  const scale = coverScale * zoom;
  const dispW = imgDim.w * scale;
  const dispH = imgDim.h * scale;

  const clamp = useCallback(
    (x, y) => {
      if (!frame.w || !scale) return { x, y };
      // Solo permite arrastrar dentro del desbordamiento real de la imagen.
      const maxX = Math.max(0, (dispW - frame.w) / 2);
      const maxY = Math.max(0, (dispH - frame.h) / 2);
      return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
    },
    [frame, dispW, dispH, scale]
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
    const canvasW = Math.max(1, Math.round(frame.w / scale));
    const canvasH = Math.max(1, Math.round(frame.h / scale));
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
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative touch-none overflow-hidden bg-black"
          style={{ width: "100%", maxWidth: `calc(60vh * ${aspect})`, aspectRatio: String(aspect) }}
        >
          {src && (
            <img
              ref={imgRef}
              src={src}
              alt=""
              draggable={false}
              className="pointer-events-none absolute left-1/2 top-1/2 select-none"
              style={{
                width: dispW,
                height: "auto",
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
              }}
            />
          )}
        </div>
      </div>

      <div className="px-6 pb-6 pt-2">
        <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wider text-parchment/60">
          <span>Zoom</span>
          <span>{zoom.toFixed(2)}x</span>
        </div>
        <input
          type="range"
          min={0.5}
          max={4}
          step={0.01}
          value={zoom}
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