import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Widget diminuto de primera visita que aparece junto a un icono de guardado.
// Se muestra solo la primera vez (localStorage compartido) y se quita con la X.
const KEY = "marea_save_hint_seen";

export default function SaveHint({ message, className }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* ignore */
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
  };

  if (!show) return null;

  return (
    <div
      className={cn(
        "fixed z-40 flex max-w-[15rem] items-center gap-2 rounded-full bg-obsidian/90 px-3 py-1.5 text-[10px] uppercase tracking-wider text-parchment shadow-lg reveal",
        className
      )}
    >
      <span className="leading-tight">{message}</span>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Cerrar"
        className="shrink-0 text-parchment/70 transition-colors hover:text-parchment"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}