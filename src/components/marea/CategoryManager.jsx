import React, { useState } from "react";
import { writeClient } from "@/lib/writeClient";
import { Plus, Eye, EyeOff, X } from "lucide-react";

// Panel de administración de secciones (categorías). Solo lo ve el admin.
// - Agregar: crea una nueva sección visible (aparece en catálogo y admin).
// - Eliminar: oculta la sección (visible=false). Desaparece del catálogo
//   público pero permanece disponible en las pantallas de administración,
//   por si hay productos que ya la usan.
export default function CategoryManager({ categories, onClose, onChange }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(null); // recordId en toggle | "add" | null

  const add = async () => {
    const label = name.trim();
    if (!label) return;
    const key = `cat_${Date.now()}`;
    const order = categories.length
      ? Math.max(...categories.map((c) => c.order || 0)) + 1
      : 1;
    setBusy("add");
    try {
      await writeClient.entities.Category.create({
        key,
        label,
        order,
        visible: true,
        is_builtin: false,
      });
      setName("");
      onChange?.();
    } finally {
      setBusy(null);
    }
  };

  const toggle = async (c) => {
    setBusy(c.recordId);
    try {
      await writeClient.entities.Category.update(c.recordId, { visible: !c.visible });
      onChange?.();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="border-b border-border/60 bg-parchment">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.18em] text-slate">
            Secciones
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-slate transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.1em] ${
                c.visible
                  ? "border-gold text-foreground"
                  : "border-border text-slate line-through"
              }`}
            >
              <span>{c.label}</span>
              <button
                type="button"
                onClick={() => toggle(c)}
                disabled={!!busy || !c.recordId}
                aria-label={c.visible ? "Ocultar sección" : "Mostrar sección"}
                className="ml-0.5 text-slate transition-colors hover:text-gold disabled:opacity-40"
              >
                {c.visible ? (
                  <Eye className="h-3.5 w-3.5" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Nueva sección"
            className="h-9 flex-1 rounded-sm border border-border bg-parchment px-3 text-sm text-foreground placeholder:text-slate/60 focus:border-gold focus:outline-none"
          />
          <button
            type="button"
            onClick={add}
            disabled={busy === "add" || !name.trim()}
            className="inline-flex h-9 items-center gap-1 rounded-full bg-gold px-4 text-[11px] uppercase tracking-[0.12em] text-parchment transition-opacity disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar
          </button>
        </div>

        <p className="mt-2 text-[10px] leading-relaxed text-slate">
          Al eliminar una sección deja de verse en el catálogo, pero permanece
          disponible en las pantallas de administración.
        </p>
      </div>
    </div>
  );
}