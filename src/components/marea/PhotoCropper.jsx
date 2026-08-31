import React, { useState, useRef, useEffect } from "react";

// Posicionador de foto estilo Instagram: marco FIJO + la imagen se mueve dentro.
// - Zoom uniforme (mismo factor X/Y) => nunca deforma la imagen.
// - Zoom mínimo = 1 (cover) => la imagen SIEMPRE cubre todo el marco, sin áreas
//   negras ni vacías. No se puede alejar más allá del cover.
// - Touch: un dedo arrastra, dos dedos pellizcan para zoom. (eventos nativos
//   no-passive para poder cancelar el scroll del navegador).
// - Mouse: arrastrar para mover (sin pinch en escritorio).
// - touch-action: none en el marco => la página nunca se mueve al editar.
// - Al guardar se exporta exactamente lo que se ve dentro del marco.
export default function PhotoCropper({ file, aspect = 4 / 5, onSave, onCancel }) {
  const [src, setSrc] = useState(null);
  const [imgDim, setImgDim] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [frame, setFrame] = useState({ w: 0, h: 0 });
  const [saving, setSaving] = useState(false);

  const frameRef = useRef(null);
  const imgRef = useRef(null);
  const pinch = useRef({ initialDist: 0, initialZoom: 1 });
  const drag = useRef({ active: false, sx: 0, sy: 0, bx: 0, by: 0 });

  // Refs espejo para leer estado dentro de los listeners sin cierres obsoletos.
  const zoomRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const imgDimRef = useRef({ w: 0, h: 0 });
  const frameSize = useRef({ w: 0, h: 0 });

  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { offsetRef.current = offset; }, [offset]);
  useEffect(() => { imgDimRef.current = imgDim; }, [imgDim]);

  // Carga la imagen y la ajusta a "cover" automáticamente.
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImgDim({ w: img.naturalWidth, h: img.naturalHeight });
      setSrc(url);
      setZoom(1);
      zoomRef.current = 1;
      setOffset({ x: 0, y: 0 });
      offsetRef.current = { x: 0, y: 0 };
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Mide el marco y mantiene la referencia de tamaño actualizada.
  useEffect(() => {
    const update = () => {
      if (frameRef.current) {
        const r = frameRef.current.getBoundingClientRect();
        setFrame({ w: r.width, h: r.height });
        frameSize.current = { w: r.width, h: r.height };
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

  // Bloquea el scroll de la página mientras el editor está abierto.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const getScale = () => {
    const { w: fw, h: fh } = frameSize.current;
    const { w: iw, h: ih } = imgDimRef.current;
    if (!iw || !fw) return 1;
    return Math.max(fw / iw, fh / ih) * zoomRef.current;
  };

  const clampOffset = (x, y, scale) => {
    const { w: fw, h: fh } = frameSize.current;
    const dispW = imgDimRef.current.w * scale;
    const dispH = imgDimRef.current.h * scale;
    const maxX = Math.max(0, (dispW - fw) / 2);
    const maxY = Math.max(0, (dispH - fh) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  };

  const applyZoom = (z) => {
    const clamped = Math.max(1, Math.min(8, z));
    zoomRef.current = clamped;
    setZoom(clamped);
    const scale = getScale();
    const off = clampOffset(offsetRef.current.x, offsetRef.current.y, scale);
    offsetRef.current = off;
    setOffset(off);
  };

  // ---- Mouse: arrastrar (pointer events, solo no-touch) ----
  const onPointerDown = (e) => {
    if (e.pointerType === "touch") return;
    drag.current = {
      active: true,
      sx: e.clientX,
      sy: e.clientY,
      bx: offsetRef.current.x,
      by: offsetRef.current.y,
    };
  };
  useEffect(() => {
    const onMove = (e) => {
      if (e.pointerType === "touch" || !drag.current.active) return;
      const dx = e.clientX - drag.current.sx;
      const dy = e.clientY - drag.current.sy;
      const scale = getScale();
      const off = clampOffset(drag.current.bx + dx, drag.current.by + dy, scale);
      offsetRef.current = off;
      setOffset(off);
    };
    const onUp = () => { drag.current.active = false; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  // ---- Touch: pellizco (zoom) + arrastre (pan). Listeners nativos no-passive. ----
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const dist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

    const onStart = (e) => {
      if (e.touches.length === 1) {
        drag.current = {
          active: true,
          sx: e.touches[0].clientX,
          sy: e.touches[0].clientY,
          bx: offsetRef.current.x,
          by: offsetRef.current.y,
        };
      } else if (e.touches.length === 2) {
        pinch.current = {
          initialDist: dist(e.touches[0], e.touches[1]),
          initialZoom: zoomRef.current,
        };
        drag.current.active = false;
      }
    };
    const onMove = (e) => {
      if (e.touches.length >= 2 && pinch.current.initialDist > 0) {
        const d = dist(e.touches[0], e.touches[1]);
        applyZoom(pinch.current.initialZoom * (d / pinch.current.initialDist));
        e.preventDefault();
      } else if (e.touches.length === 1 && drag.current.active) {
        const dx = e.touches[0].clientX - drag.current.sx;
        const dy = e.touches[0].clientY - drag.current.sy;
        const scale = getScale();
        const off = clampOffset(drag.current.bx + dx, drag.current.by + dy, scale);
        offsetRef.current = off;
        setOffset(off);
        e.preventDefault();
      }
    };
    const onEnd = (e) => {
      if (e.touches.length < 2) pinch.current.initialDist = 0;
      if (e.touches.length === 0) {
        drag.current.active = false;
      } else if (e.touches.length === 1) {
        drag.current = {
          active: true,
          sx: e.touches[0].clientX,
          sy: e.touches[0].clientY,
          bx: offsetRef.current.x,
          by: offsetRef.current.y,
        };
      }
    };

    el.addEventListener("touchstart", onStart, { passive: false });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: false });
    el.addEventListener("touchcancel", onEnd, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  // Escala uniforme final (mismo factor en X e Y => sin deformación).
  const coverScale = frame.w && imgDim.w ? Math.max(frame.w / imgDim.w, frame.h / imgDim.h) : 1;
  const scale = coverScale * zoom;
  const dispW = imgDim.w * scale;
  const dispH = imgDim.h * scale;

  const handleSave = () => {
    if (!imgDim.w || !scale || !imgRef.current) return;
    setSaving(true);
    const canvasW = Math.max(1, Math.round(frame.w / scale));
    const canvasH = Math.max(1, Math.round(frame.h / scale));
    const drawX = ((frame.w - dispW) / 2 + offset.x) / scale;
    const drawY = ((frame.h - dispH) / 2 + offset.y) / scale;
    const canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext("2d");
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
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-obsidian">
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
        <p className="text-center text-[11px] text-parchment/50">
          Arrastra para mover · pellizca para hacer zoom
        </p>
      </div>
    </div>
  );
}