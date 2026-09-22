import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Burbuja de primera visita que apunta (con un piquito) hacia el icono de
// guardados. Rosa MAREA, esquinas suaves y aireada. Se muestra solo la
// primera vez (localStorage) y se quita con la X.
export default function SaveHint({ message, className, storageKey = "marea_save_hint_seen", tailRight = 12 }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(storageKey)) setShow(true);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
  };

  if (!show) return null;

  return (
    <div className={cn("fixed z-40", className)}>
      <div className="relative max-w-[15.5rem] rounded-2xl bg-gold px-4 py-3 shadow-lg reveal">
        {/* Piquito hacia arriba, alineado bajo el icono de guardados */}
        <span
          className="absolute -top-1.5 h-3 w-3 rotate-45 rounded-[2px] bg-gold"
          style={{ right: `${tailRight}px` }}
        />
        <div className="flex items-start gap-2.5">
          <span className="text-[11px] leading-snug tracking-wide text-parchment">
            {message}
          </span>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Cerrar"
            className="-mr-1 -mt-0.5 shrink-0 rounded-full p-0.5 text-parchment/70 transition-colors hover:text-parchment"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}