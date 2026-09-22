import React, { useRef, useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

// Deslizar a la izquierda para revelar un botón de eliminar (uso administrativo).
// El contenido debe tener fondo sólido (bg-parchment) para ocultar el botón
// hasta que se revela. La confirmación la maneja el padre vía onRequestDelete.
export default function SwipeToDelete({ children, onRequestDelete, revealWidth = 84 }) {
  const [dx, setDx] = useState(0);
  const [open, setOpen] = useState(false);
  const drag = useRef({ active: false, startX: 0, startDx: 0 });
  const openRef = useRef(false);
  useEffect(() => { openRef.current = open; }, [open]);

  const begin = (clientX, pt) => {
    drag.current = { active: true, startX: clientX, startDx: openRef.current ? -revealWidth : 0, moved: false, pt };
  };
  const move = (clientX) => {
    if (!drag.current.active) return;
    let delta = clientX - drag.current.startX + drag.current.startDx;
    if (Math.abs(delta) > 5) drag.current.moved = true;
    if (delta > 0) delta = delta * 0.25;
    if (delta < -revealWidth - 30) delta = -revealWidth - 30;
    setDx(delta);
  };
  const end = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    setDx((cur) => {
      const finalOpen = cur < -revealWidth / 2;
      setOpen(finalOpen);
      return finalOpen ? -revealWidth : 0;
    });
  };

  useEffect(() => {
    const pm = (e) => { if (e.pointerType !== "touch") move(e.clientX); };
    const pu = () => end();
    window.addEventListener("pointermove", pm);
    window.addEventListener("pointerup", pu);
    window.addEventListener("pointercancel", pu);
    return () => {
      window.removeEventListener("pointermove", pm);
      window.removeEventListener("pointerup", pu);
      window.removeEventListener("pointercancel", pu);
    };
  }, []);

  return (
    <div className="relative overflow-hidden">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(false); setDx(0); onRequestDelete(); }}
        aria-label="Eliminar"
        className="absolute bottom-0 right-0 top-0 flex items-center justify-center bg-destructive text-parchment"
        style={{ width: revealWidth, transform: `translateX(${revealWidth + dx}px)` }}
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <div
        onTouchStart={(e) => begin(e.touches[0].clientX, "touch")}
        onTouchMove={(e) => move(e.touches[0].clientX)}
        onTouchEnd={end}
        onPointerDown={(e) => { if (e.pointerType !== "touch") begin(e.clientX, e.pointerType); }}
        onClick={() => {
          // Click-to-reveal en escritorio (no-touch). En móvil se usa el swipe.
          if (drag.current.moved) { drag.current.moved = false; return; }
          if (drag.current.pt === "touch") return;
          setOpen((o) => {
            const next = !o;
            setDx(next ? -revealWidth : 0);
            return next;
          });
        }}
        style={{
          transform: `translateX(${dx}px)`,
          transition: drag.current.active ? "none" : "transform 200ms ease",
        }}
        className="relative cursor-pointer bg-parchment"
      >
        {children}
      </div>
    </div>
  );
}