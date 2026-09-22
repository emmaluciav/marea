import React, { useState } from "react";
import { X } from "lucide-react";

const DEFAULT_HEX = "#DB949B";

// Editor admin del color de acento rosa de MAREA. Pide un hex y lo guarda;
// el padre se encarga de persistirlo y aplicarlo globalmente.
export default function AccentColorEditor({ currentHex, onSave, onClose }) {
  const [hex, setHex] = useState(currentHex || DEFAULT_HEX);
  const valid = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/40 px-6">
      <div className="w-full max-w-sm rounded-sm bg-parchment p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-heading text-base text-foreground">Color de acento MAREA</h3>
          <button onClick={onClose} aria-label="Cerrar" className="text-slate hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-xs text-slate">
          Ingresa un código hex. Cambia todo lo que usa el rosa MAREA (botones, iconos, líneas, highlights).
        </p>
        <div className="mt-4 flex items-center gap-3">
          <span
            className="h-10 w-10 shrink-0 rounded-sm border border-border"
            style={{ background: valid ? hex : DEFAULT_HEX }}
          />
          <input
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            placeholder="#DB949B"
            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm uppercase tracking-wider"
          />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border px-5 py-2 text-xs uppercase tracking-wider text-foreground"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!valid}
            onClick={() => onSave(valid ? hex : DEFAULT_HEX)}
            className="rounded-full bg-gold px-5 py-2 text-xs uppercase tracking-wider text-parchment disabled:opacity-50"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}